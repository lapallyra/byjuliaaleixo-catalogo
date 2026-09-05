const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/Sidebar.tsx', 'utf8');

const regex = /<motion\.div\s*initial=\{false\}\s*animate=\{\{\s*height: isCollapsed \|\| isExpanded \? 'auto' : 0,\s*opacity: isCollapsed \|\| isExpanded \? 1 : 0\s*\}\}\s*transition=\{\{ duration: 0\.22, ease: "easeInOut" \}\}\s*className="overflow-hidden flex flex-col gap-1"\s*>([\s\S]*?)<\/motion\.div>/g;

code = code.replace(regex, `<AnimatePresence initial={false}>
                          {(isCollapsed || isExpanded) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden flex flex-col gap-1"
                            >
                                $1
                            </motion.div>
                          )}
                        </AnimatePresence>`);

if (!code.includes('AnimatePresence')) {
  console.log("Regex didn't match.");
} else {
  if (code.includes("import { motion } from 'motion/react';")) {
     code = code.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
  }
  fs.writeFileSync('src/components/Admin/Sidebar.tsx', code);
  console.log("Accordion fixed!");
}
