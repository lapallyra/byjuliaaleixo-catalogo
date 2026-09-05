const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/Sidebar.tsx', 'utf8');

// replace the motion.div with AnimatePresence
if (!code.includes('AnimatePresence')) {
  code = code.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
}

const motionDivStart = /<motion\.div[\s\S]*?animate=\{\{[\s\S]*?\}\}[\s\S]*?transition=\{\{[\s\S]*?\}\}[\s\S]*?className="overflow-hidden flex flex-col gap-1"\s*>/;

// Looking closely at the code
// <motion.div
//    initial={false}
//    animate={{
//       height: isCollapsed || isExpanded ? 'auto' : 0,
//       opacity: isCollapsed || isExpanded ? 1 : 0 
//     }}
//    transition={{ duration: 0.22, ease: "easeInOut" }}
//    className="overflow-hidden flex flex-col gap-1"
// >

code = code.replace(motionDivStart, `<AnimatePresence initial={false}>
                          {(isCollapsed || isExpanded) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden flex flex-col gap-1"
                            >`);

const motionDivEnd = /<\/motion\.div>/g;
// Since there might be other motion.divs, we have to be careful.
// Let's just use string replace for the exact block.
