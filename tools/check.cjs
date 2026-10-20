const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),root=path.join(__dirname,'..');
let failed=0;
function run(file,args=[]){const result=cp.spawnSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8'});if(result.status!==0){failed++;console.error(result.stdout,result.stderr);}return result.status===0;}
if(!run('tools/build-offline.cjs',['--check']))process.exit(1);
for(const file of [...fs.readdirSync(root).filter(f=>f.endsWith('.js')),'dictation/dictation.js']){
 const result=cp.spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});if(result.status!==0){failed++;console.error(result.stderr);}
}
const suites=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.cjs'));
for(const suite of suites)console.log((run('tests/'+suite)?'PASS ':'FAIL ')+suite);
console.log(`${suites.length} test suites; ${failed} failures. Browser/device checks are separate.`);process.exitCode=failed?1:0;
