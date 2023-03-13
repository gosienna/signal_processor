//code for initialization of gapi, load google drive or existing data in indexedDB




class Model{
    constructor(){
        this.CLIENT_ID = '170126668191-bcrse0te9km60a43b9pvnfo2o1jjfm2j.apps.googleusercontent.com';
        this.API_KEY = 'AIzaSyCuIIugSuCK1F2LORGG4-Z2IcQwyPNFKA8';
        this.DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        this.SCOPES = 'https://www.googleapis.com/auth/drive';
        this.gapiInited = false;
        this.gisInited = false;
        this.accessToken = null;
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
        this.signoutButton.style.display = 'none'
        this.pickButton.style.display = 'none'
        this.hideButton.style.display = 'none'
        this.saveButton.style.display = 'none'
        this.showLoading.style.display = 'none'
    }
}

class Controller{
    //initialized gapi first
    constructor(model){
        gapi.load('client', () => {
            gapi.client.init({
                // initialize the gapi client
                apiKey: model.API_KEY,
                discoveryDocs: model.DISCOVERY_DOCS,
            }).then(() => {
                model.gapiInited = true
                console.log('gapi client initialized');
            }).catch(err => {
              console.error('Error initializing gapi client:', err);
            });
          });
    }

    //app initialization, by loading gapi and gis
    init(model, view){
        gapi.load('picker', this.onPickerApiLoad(model))
        let tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: model.CLIENT_ID,
            scope: model.SCOPES,
            callback: this.check_gapi(model)
        });
        
    }

    onPickerApiLoad(model) {
        model.pickerInited = true
    }

    check_gapi(model){
        model.gisInited = true;
        console.log('check_gapi')
    }
}
//=========================initialized the app=========================
let model = new Model()
let view = new View()
let controller = new Controller(model)
controller.init(model, view)
