import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/app/**/*.tsx");

for (const sourceFile of project.getSourceFiles()) {
  const prismaImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "@/lib/prisma");
  if (!prismaImport) continue;

  let authImport = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === "@/lib/auth");
  if (!authImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@/lib/auth",
      namedImports: ["requireUser"]
    });
  } else {
    if (!authImport.getNamedImports().some(ni => ni.getName() === "requireUser")) {
      authImport.addNamedImport("requireUser");
    }
  }

  const exportDefault = sourceFile.getDefaultExportSymbol()?.getDeclarations()[0];
  let hasUser = false;
  if (exportDefault && exportDefault.getKind() === SyntaxKind.FunctionDeclaration) {
    const body = exportDefault.getBody();
    if (body && body.getKind() === SyntaxKind.Block) {
      const text = body.getText();
      if (!text.includes("const user =") && !text.includes("requireRole(")) {
         body.insertStatements(0, "const user = await requireUser();");
         hasUser = true;
      } else if (text.includes("requireRole(") || text.includes("requireUser(")) {
         hasUser = true;
      }
    }
  }

  // Find prisma calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const text = expr.getText();
      if (text.startsWith("prisma.")) {
        const parts = text.split(".");
        if (parts.length === 3) {
          const model = parts[1];
          const method = parts[2];

          if (["findMany", "findUnique", "findFirst", "count", "aggregate"].includes(method)) {
            // Models without direct shopId
            if (["user", "session", "shop", "shopSettings", "auditLog"].includes(model)) continue;

            const args = callExpr.getArguments();
            if (args.length === 0) {
              if (model === "productVariant") {
                callExpr.addArgument(`{ where: { product: { shopId: user.shopId } } }`);
              } else if (model === "payment") {
                callExpr.addArgument(`{ where: { sale: { shopId: user.shopId } } }`);
              } else if (model === "saleItem" || model === "purchaseItem") {
                 // skip nested items, they belong to sale/purchase
              } else {
                callExpr.addArgument(`{ where: { shopId: user.shopId } }`);
              }
            } else if (args.length === 1 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
              const obj = args[0];
              const whereProp = obj.getProperty("where");
              
              const condition = model === "productVariant" 
                 ? "product: { shopId: user.shopId }" 
                 : (model === "payment" ? "sale: { shopId: user.shopId }" : "shopId: user.shopId");

              if (whereProp && whereProp.getKind() === SyntaxKind.PropertyAssignment) {
                const initializer = whereProp.getInitializer();
                if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
                  // Don't add if already there
                  if (!initializer.getText().includes("shopId")) {
                    initializer.addPropertyAssignment({
                      name: condition.split(":")[0].trim(),
                      initializer: condition.split(":").slice(1).join(":").trim()
                    });
                  }
                }
              } else {
                obj.addPropertyAssignment({
                  name: "where",
                  initializer: `{ ${condition} }`
                });
              }
            }
          }
        }
      }
    }
  }
}
project.saveSync();
console.log("Done");
