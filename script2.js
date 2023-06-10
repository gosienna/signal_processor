import {initIndexedDB, addEdfToDB, getEdfFromDB} from './indexedDB.js'
import {EDF} from './edf.js'

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
        this.dbName = 'edfDatabase'
        this.storeName = 'edf'
        this.dbversion = 1
        initIndexedDB(this.dbName, this.storeName, this.dbversion)
        // read the edf from the indexedDB
        getEdfFromDB(this.dbName, this.storeName, this.dbversion, 1).then(result => {
            this.edf = result
        })
        .catch(error => {
            console.error(error);
        });

    }
    
}

class View{
    constructor(){
        //manage appearance of button
        this.signinButton = document.getElementById('btn_sign_in')
        this.signoutButton = document.getElementById('btn_sign_out')
        this.pickButton = document.getElementById('btn_pick_folder')
        this.hideButton = document.getElementById('btn_hide_folder')
        this.saveButton = document.getElementById('btn_save_edf')
        this.showLoading = document.getElementById('showLoading')
        this.signinButton.style.display = 'none'
        this.signoutButton.style.display = 'none'
        this.pickButton.style.display = 'none'
        this.hideButton.style.display = 'none'
        this.saveButton.style.display = 'none'
        this.showLoading.style.display = 'none'
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

        //load data from indexedDB

   
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
                this.showFolderEDF(this.view)
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
            localStorage.setItem('dataFolderName',folderName)
            alert("You choose folder "+folderName+" id: "+folderId)
            this.showFolderEDF(this.view)
        }
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
            }
            else if((filetype === "application/octet-stream") && (file_ext === 'edf')){
                self.view.showLoading.style.display = 'flex'
                self.loadEDF(fileId, fileName) 
                alert("This is a edf file!")
            }
        })
    }
    //loadEDF file to the indexedDB
    loadEDF(fileId, fileName){
        let dbName = this.model.dbName
        let storeName = this.model.storeName
        let dbversion = this.model.dbversion
        let view = this.view
        console.log('loadEDF')
        gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(function (response) {
            view.showLoading.style.display = 'none' 
            let enc = new TextEncoder()
            let edf_unit8 = enc.encode(response.body)
            let edf = new EDF(edf_unit8)
            addEdfToDB(dbName, dbversion, storeName, {"id":fileName, 'edf':edf}) //use fileName as id
        })
    }



}
//=========================initialized the app=========================

let model = new Model()
let view = new View()
let controller = new Controller(model, view)


