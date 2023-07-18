import {initIndexedDB, putDataToDB, getDataFromDB} from './indexedDB.js'
import { Plot2D } from './Plot2D.js';
var decoder = new edfdecoder.EdfDecoder();
console.log(decoder)
//code for initialization of gapi, load google drive or existing data in indexedDB

class Model{
    constructor(){
        this.CLIENT_ID = '170126668191-bcrse0te9km60a43b9pvnfo2o1jjfm2j.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyCuIIugSuCK1F2LORGG4-Z2IcQwyPNFKA8';
        this.DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.SCOPES = 'https://www.googleapis.com/auth/drive';
        this.gapiInited = false
        this.gisInited = false
        this.accessToken = null
        this.tokenClient = null
        this.pickerInited = false
        this.clientInited = false
        this.dbName = 'edfDB'
        this.storeName = 'edfStore'
        this.id = ""
        this.dbversion = 1
        this.plot_ecg = new Plot2D()
        this.ecg = [] //array of ecg data
        this.ecg_fs = 125
        this.total_time = 0
        this.window_size = 10
        this.display_scale = 1.0
        initIndexedDB(this.dbName, this.storeName, this.dbversion)
        //initialize plot_ecg
        
    }
    
}

class View{
    constructor(){
        //manage appearance of button
        this.signinButton = document.getElementById('btn_sign_in')
        this.signoutButton = document.getElementById('btn_sign_out')
        this.pickButton = document.getElementById('btn_pick_folder')
        this.hideButton = document.getElementById('btn_hide_folder')
        this.showLoading = document.getElementById('showLoading')
        this.canvas_ecg = document.getElementById('canvas_ecg')
        this.window_slelect = document.getElementById('window_select')
        this.scale_select = document.getElementById('scale_select')
        this.slider = document.getElementById('slider')
        this.signinButton.style.display = 'none'
        this.signoutButton.style.display = 'none'
        this.pickButton.style.display = 'none'
        this.hideButton.style.display = 'none'
        this.showLoading.style.display = 'none'
        this.slider.style.display = 'none'
        this.scale_select.style.display = 'none'
        this.window_slelect.style.display = 'none'
    }
}

class Controller{
    //initialized gapi first
    constructor(model, view){
        this.model = model
        this.view = view
        //load gapi
        gapi.load('client', () => {
            gapi.client.init({
                // initialize the gapi client
                apiKey: model.API_KEY,
                discoveryDocs: model.DISCOVERY_DOCS,
            }).then(this.gapiInited()
            ).catch(err => {
              console.error('Error initializing gapi client:', err);
            })
          })
        //load client
        this.model.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.model.CLIENT_ID,
            scope: this.model.SCOPES,
            callback: this.clientInited()
        })
        gapi.load('picker', () => {model.pickerInited = true})
        //add event listener
        view.signinButton.addEventListener('click', this.handleAuthClick.bind(this))
        view.pickButton.addEventListener('click', this.handlePickClick.bind(this))

        //bind class functions to loadData function
        this.loadData = this.loadData.bind(this)
        
        //check if there is ecg data in indexedDB
        getDataFromDB(this.model.dbName, this.model.storeName, this.model.dbversion, 1)
            .then((data) => {
                alert('Found data from indexedDB')
                this.view.showLoading.style.display = 'flex';
                setTimeout(() => {
                    console.log(data)
                    // Papa.parse(data.csv, {
                    //     complete: (parsedData) => {
                    //     this.model.ecg = parsedData.data.map(parseFloat);
                    //     this.model.id = data.id;
                    //     this.plotECG();
                    //     this.view.showLoading.style.display = 'none';
                    //     }
                    // })
                }, 0);
            }).catch((err) => {
                alert(err)
            })
        
    }


    handleAuthClick(){
        console.log('handleAuthClick')
        // call back function for checking token existance
        this.model.tokenClient.callback = async (response) => {
            
            if (response.error !== undefined) {
            throw (response);
            }
            console.log('Logging succeful, create picker the first time!')
            this.model.accessToken = response.access_token
            this.view.pickButton.style.display = 'block'
            if(localStorage.getItem('dataFolderID')!==null){
                this.showFolder(this.view)
            }

        }

        //aquire access token
        if (this.model.accessToken === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            this.model.tokenClient.requestAccessToken({
                prompt: 'consent'
            })
        }
        else {
            // Skip display of account chooser and consent dialog for an existing session.
            this.model.tokenClient.requestAccessToken({prompt: ''});
        }
    }

    handlePickClick(){
        console.log('handlePickClick')
        //define picker format
        let viewPicker = new google.picker.DocsView(google.picker.ViewId.DOCS)
                            .setIncludeFolders(true)
                            .setSelectFolderEnabled(true)
                            .setLabel ("~Choose your data folder~")
        //create picker and set callback function
        const picker = new google.picker.PickerBuilder()
                            .addView(viewPicker)
                            .setOAuthToken(this.model.accessToken)
                            .setDeveloperKey(this.model.API_KEY)
                            .setCallback(this.pickerCallback.bind(this))
                            .build();
        picker.setVisible(true);
    
    }

    gapiInited(){
        this.model.gapiInited = true
        this.maybeEnableButtons()
        console.log('gapi initialized!')
    }

    clientInited(){
        this.model.clientInited = true
        this.maybeEnableButtons()
        console.log('client initialized!')
    }

    maybeEnableButtons(){
        if (this.model.gapiInited && this.model.clientInited){
            this.view.signinButton.style.display = 'block'
        }
    }

    pickerCallback(data){
        if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
            let doc = data[google.picker.Response.DOCUMENTS][0];
            let folderId = doc.id
            let folderName = doc.name
            localStorage.setItem('dataFolderID',folderId)
            console.log('You choose folder '+folderName)
            localStorage.setItem('dataFolderName',folderName)
            alert("You choose folder "+folderName+" id: "+folderId)
            this.showFolder(this.view)
        }
    }
    showFolder(view){
        const self = this
        console.log('showFolder')
        let dataFolderID = localStorage.getItem('dataFolderID')
        gapi.client.drive.files.list({
            'pageSize': 1000,
            'q':  `'${dataFolderID}' in parents`
        }).then(function (response) {
            let files = response.result.files;
            console.log(response)
            if (files && files.length > 0) {
                let folderContent = document.getElementById('folderContent')
                folderContent.innerHTML = ''
                for (var i = 0; i < files.length; i++) {
                    folderContent.innerHTML += `
                    <button class="file_btn btn btn-secondary btn-sm mt-1 ml-1"  data-fileId="${files[i].id}">${files[i].name}</button>
                    `
                }  
                let file_btns = document.getElementsByClassName('file_btn')
                for (let i = 0; i < file_btns.length; i++){
                    file_btns[i].addEventListener('click', (event)=>{self.loadData(event)})
                }

                view.hideButton.style.display = 'block'
    
            } else {
                folderContent.innerHTML = '<div style="text-align: center;">No Files</div>'
            }
        })
    }

    showFolderEDF(view){
        const self = this
        console.log('showFolderEDF')
        let dataFolderID = localStorage.getItem('dataFolderID')
        gapi.client.drive.files.list({
            'pageSize': 1000,
            'q':  `'${dataFolderID}' in parents`
        }).then(function (response) {
            let files = response.result.files;
            if (files && files.length > 0) {
                let folderContent = document.getElementById('folderContent')
                folderContent.innerHTML = ''
                console.log(files)
                for (var i = 0; i < files.length; i++) {
                    let file_name = files[i].name
                    if (file_name.split('.')[1] === 'edf'){
                        folderContent.innerHTML += `
                        <button class="file_btn btn btn-secondary btn-sm mt-1 ml-1"  data-fileId="${files[i].id}">${files[i].name}</button>
                        `
                    }
                }  
                let file_btns = document.getElementsByClassName('file_btn')
                for (let i = 0; i < file_btns.length; i++){
                    file_btns[i].addEventListener('click', (event)=>{self.loadData(event)})
                }

                view.hideButton.style.display = 'block'
    
            } else {
                folderContent.innerHTML = '<div style="text-align: center;">No Files</div>'
            }
        })
    }
    //load data from google drive
    loadData(event){
        let self = this
        console.log('loadData')
        let fileId = event.target.getAttribute("data-fileId")  
        gapi.client.drive.files.get({
                fileId: fileId,
                fields: 'webContentLink,id,name,mimeType',
        }).then(function (response) {
            let filetype = response.result.mimeType
            let file_ext = response.result.name.split('.').pop()
            let fileName = response.result.name
            if(filetype === "text/csv"){
                alert("This is a csv file!")
                self.view.showLoading.style.display = 'flex'
                self.loadCSV(fileId, fileName)
            }else  if(file_ext === "edf"){
                alert("This is a edf file!")
                self.view.showLoading.style.display = 'flex'
                self.loadEDF(fileId, fileName)
            }
        })
    }
    //load CSV file to the indexedDB
    loadCSV(fileId, fileName){
        this.model.dbName = "csvDB"
        this.model.storeName = "csvStore"
        let dbversion = this.model.dbversion
        let view = this.view
        console.log('loadCSV')
        gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(function (response) {
            view.showLoading.style.display = 'none' 
            putDataToDB(dbName, dbversion, storeName, {"id":fileName, 'csv':response.body}, 1) //use fileName as id
            this.model.ecg = Papa.parse(response.body).data.map(parseFloat)
            this.plotECG()
        })
    }

    loadEDF(fileId, fileName){ //load EDF file to the indexedDB
        this.model.dbName = "edfDB"
        this.model.storeName = "edfStore"
        let dbversion = this.model.dbversion
        let view = this.view
        console.log('loadEDF')
        gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(function (response) {
            view.showLoading.style.display = 'none' 
            putDataToDB(dbName, dbversion, storeName, {"id":fileName, 'edf':response.body}, 1) //use fileName as id
            //......
            //......
            // this.plotECG()
        })
    }

    //plot ecg
    plotECG(){
        this.model.ecg.pop() //remove the last element, since the array contain nan
        this.total_time = parseInt(this.model.ecg.length/this.model.ecg_fs)

        let w = window.innerWidth
        let h = 300
        this.model.plot_ecg.init(this.model.ecg, "canvas_ecg", w, h)
        let fs = this.model.ecg_fs
        this.model.plot_ecg.update_displayRange(0,this.model.window_size*fs)
        document.addEventListener('keydown', function(event) {
            let fs = this.model.ecg_fs
            let window_size = this.model.window_size
            if (event.code === "ArrowRight"){
                let currentValue = parseInt(slider.value)
                this.view.slider.value = currentValue+parseInt(window_size/2)
                this.model.plot_ecg.update_displayRange(
                    this.model.plot_ecg.camera.left+fs*parseInt(window_size/2),
                    this.model.plot_ecg.camera.right+fs*parseInt(window_size/2))
            }else if(event.code === "ArrowLeft"){
                let currentValue = parseInt(slider.value)
                this.view.slider.value = currentValue-parseInt(window_size/2)
                this.model.plot_ecg.update_displayRange(
                    this.model.plot_ecg.camera.left-fs*parseInt(window_size/2),
                    this.model.plot_ecg.camera.right-fs*parseInt(window_size/2))
            }
        }.bind(this))

        //show slider, window_select, and window_size
        this.view.slider.style.display = 'block'
        this.view.window_slelect.style.display = 'inline'
        this.view.scale_select.style.display = 'inline'
        this.view.slider.style.width = w+'px'
        this.view.slider.min = 0
        this.view.slider.max = this.total_time
        this.view.slider.value = 0

        //update slider value by slider
        this.view.slider.addEventListener('input', function(event){ //update display range based on slider value
            let window_size = this.model.window_size
            let fs = this.model.ecg_fs
            let start = this.view.slider.value
            this.model.plot_ecg.update_displayRange(start*fs,start*fs+window_size*fs)
        }.bind(this))

        //update window size by window_select
        this.view.window_slelect.addEventListener('change', function(event){ //update display window size
            let window_size = parseInt(this.view.window_slelect.value)
            this.model.window_size = window_size
            let fs = this.model.ecg_fs
            let start = parseInt(this.view.slider.value*fs)
            this.model.plot_ecg.update_displayRange(start,start+window_size*fs)
        }.bind(this))
        //update signal scale by scale_select
        this.view.scale_select.addEventListener('change', function(event){ //update display window size
            let scale = parseFloat(this.view.scale_select.value)
            this.model.plot_ecg.clear_data()
            let new_data = this.model.ecg.map(element => element*scale)
            this.model.plot_ecg.draw_data(new_data)
        }.bind(this))
    }

}
//=========================initialized the app=========================

let model = new Model()
let view = new View()
let controller = new Controller(model, view)
