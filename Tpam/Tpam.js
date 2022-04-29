const puppeteer = require('puppeteer');  
const fs = require('fs');

let usuario = '####';
let Password = '#####';

const newFinalClaves = [];
const alfas = fs.readFileSync('clavesPorSolicitar.txt','utf-8');
const req = fs.readFileSync('requerimientoAcoountNm.txt','utf-8');

(async ()=>{
    const browser = await puppeteer.launch({headless:false, slowMo: 1 });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1080,
      height: 1920,
      deviceScaleFactor:1,
  })
  await page.setDefaultNavigationTimeout(0);
  await page.goto('Url del aplicativo Tpam del banco')

  try {
    await page.type('#loginUserName',usuario)
    await page.type('#loginPassword',Password)
    console.log(`ingresando claves y procediendo a recargar`);
    await page.click('#btnLogin')
    await page.waitForTimeout(2000)
    await page.reload();
    await page.waitForSelector('#nav')
  } catch (error) {
    await page.waitForTimeout(500)  
    await page.screenshot({path: "imagenes/ErrorDeIngreso.png",fullPage: true});
    console.log('verificar el error indicado en la imagenen llamada: TpamErrorInicialFoto.png')
    await browser.close();
  }
  let arrayClaves = alfas.split('\r\n');
  let reqAcooin = req.split('\r\n');

  arrayClaves = arrayClaves.filter(el => el != '')
  for(let i = 0;i < arrayClaves.length;i++){
    await page.click('#Filter')
    console.log(arrayClaves[i]);
    if(i == 0){
        await page.type('#SystemNm',arrayClaves[i].trim())
        await page.type('#AccountNm',reqAcooin[1].trim())
    }else{
        const input = await page.$('#SystemNm')
        await input.click({clickCount:3})
        await input.type(arrayClaves[i].trim())
    }
    try {
        await page.click('#Listing')
    await page.waitForSelector('#AccountListing')
    const alfa = await page.$$('#AccountListing tbody tr')
    if(alfa.length == 0){
      console.log('Error en el momento de generar claves, verificar la imagen:TpamErrorEnProcesosAccountListeng.pgn');
      await page.screenshot({path: "imagenes/TpamErrorEnProcesosAccountListeng.png",fullPage: true});
      continue;
    }
    await alfa[0].click()
    await page.click('#ResetPassButton')
    await page.waitForTimeout(5000)
    await page.click('#Passwords')
    await page.type('#ReleaseReasonText',reqAcooin[0])
    await page.click('#Password')
    await page.waitForSelector('.coloredPassword')
    const lalo = await page.evaluate(()=>{
        const span = document.querySelector('.coloredPassword').innerText
        return span
    })
    newFinalClaves.push(`${arrayClaves[i]} -- ${lalo}`)

    await page.waitForTimeout(500)
    } catch (error) {
        await page.waitForTimeout(20000)
        await page.screenshot({path: "imagenes/TpamErrorEnProcesos.png",fullPage: true});
        console.log(`Se a producido un error con el siguiente servidor ${arrayClaves[i]}, verificar una vez terminado la ejecucion el origen del error, posiblemente se genero una imagen con el nombre TpamErrorEnProcesos.png para su validacion`);
        continue;
    }
  }
  let newContent = newFinalClaves.toString()
  fs.writeFile('clavesTpamRealizadas.txt',newContent.replace(/,/g,'\n'),(erro,arch)=>{
    if(erro){
        console.log(erro);
    }
})
  console.log(`Proceso finalizado`)
  await browser.close();
})();
