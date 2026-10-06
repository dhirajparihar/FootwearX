import { Project, SyntaxKind } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const text = expr.getText();
      if (text.startsWith("prisma.") || text.startsWith("tx.")) {
        const parts = text.split(".");
        if (parts.length === 3) {
          const model = parts[1];
          const method = parts[2];
          
          if (method === "findUnique" || method === "update") {
             const args = callExpr.getArguments();
             if (args.length === 1 && args[0].getKind() === SyntaxKind.ObjectLiteralExpression) {
                const argText = args[0].getText();
                if (argText.includes("shopId") || argText.includes("product:")) {
                   // Cannot use findUnique or update with non-unique fields.
                   // Change findUnique to findFirst, update to updateMany.
                   expr.replaceWithText(`${parts[0]}.${model}.${method === "findUnique" ? "findFirst" : "updateMany"}`);
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
