//variable for google api
let CLIENT_ID = '170126668191-bcrse0te9km60a43b9pvnfo2o1jjfm2j.apps.googleusercontent.com';
let API_KEY = 'AIzaSyCuIIugSuCK1F2LORGG4-Z2IcQwyPNFKA8';
let DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
let SCOPES = 'https://www.googleapis.com/auth/drive';
let gapiInited = false;
let gisInited = false;
let accessToken = null;

//manage appearance of button
let signinButton = document.getElementById('btn_sign_in')
let signoutButton = document.getElementById('btn_sign_out')
let pickButton = document.getElementById('btn_pick_folder')
let hideButton = document.getElementById('btn_hide_folder')
let saveButton = document.getElementById('btn_save_edf')
let showLoading = document.getElementById('showLoading')
signoutButton.style.display = 'none'
pickButton.style.display = 'none'
hideButton.style.display = 'none'
saveButton.style.display = 'none'
showLoading.style.display = 'none'

//initialization
window.onload = () => {
    gapiLoaded()
    gisLoaded()
    openDB()
}


saveButton.onclick = () => addEdf()

function gapiLoaded() {
    gapi.load('client', initializeGapiClient)
    gapi.load('picker', onPickerApiLoad)
}

function onPickerApiLoad() {
    pickerInited = true
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true
    maybeEnableButtons();
}

//create google picker for folder choosing, the pickerCallback will return the folderID and trigger next move
function createPicker() {
    console.log('createPicker!')
    const showPicker = () => {
        let view = new google.picker.DocsView(google.picker.ViewId.DOCS)
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setLabel ("~Choose your data folder~")
        const picker = new google.picker.PickerBuilder()
                        .addView(view)
                        .setOAuthToken(accessToken)
                        .setDeveloperKey(API_KEY)
                        .setCallback(pickerCallback)
                        .build();
        picker.setVisible(true);
    }

    // Request an access token
    tokenClient.callback = async (response) => {
        
      if (response.error !== undefined) {
        throw (response);
      }
      console.log('Logging succeful, create picker the first time!')
      accessToken = response.access_token;
      showPicker();
    };

    if (accessToken === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      showPicker()
    }
}

function pickerCallback(data) {

    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      let doc = data[google.picker.Response.DOCUMENTS][0];
      let folderId = doc.id
      let folderName = doc.name
      localStorage.setItem('dataFolderID',folderId)
      localStorage.setItem('dataFolderName',folderName)
      alert("You choose folder "+folderName+" id: "+folderId)
      showFolderContent()
    }
    
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: ''
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        signinButton.style.display = 'block'
    }
}

signinButton.onclick = () => handleAuthClick()
function handleAuthClick() {
    tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
            throw (resp);
        }
        accessToken = response.access_token;
        signinButton.style.display = 'none'
        signoutButton.style.display = 'block'
        pickButton.style.display = 'block'
        let dataFolderID = localStorage.getItem('dataFolderID')
        //if a folder has been picked in this browser show it directly, else, pick one
        if (dataFolderID !== null){ 
            showFolderContent()
        }else{
            createPicker()
        }
    };

    if (accessToken === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        if (dataFolderID !== null){ 
            showFolderContent()
        }else{
            createPicker()
        }
    }
}

signoutButton.onclick = () => handleSignoutClick()
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        signinButton.style.display = 'block'
        signoutButton.style.display = 'none'
    }
}

pickButton.onclick = () => createPicker()



//open folder and show content in listcontainer
function showFolderContent(){
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
                    <button class="btn btn-secondary btn-sm mt-1 ml-1" onclick="loadData(this)" data-fileId="${files[i].id}">${files[i].name}</button>
                    `
                }
            }  
            hideButton.style.display = 'block'

        } else {
            folderContent.innerHTML = '<div style="text-align: center;">No Files</div>'
        }
    })
}

//function to load data
function loadData(btn){
    let fileId = btn.getAttribute("data-fileId")  
    gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'webContentLink,id,name,mimeType',
        }).then(function (response) {
            let filetype = response.result.mimeType
            let file_ext = response.result.name.split('.').pop()
            let fileName = response.result.name
            if (filetype === "application/vnd.google-apps.folder"){ //if the item being click is a folder
                alert("This is a folder!")
                openfolder(fileId) //open up the target folder 
            }
            else if(filetype === "text/csv"){
                alert("This is a csv file!")
            }
            else if((filetype === "application/octet-stream") && (file_ext === 'edf')){
                showLoading.style.display = 'flex'
                loadEDF(fileId, fileName) 
            }
        })
}

//load edf file into localstorage of browser
function loadEDF(fileId, fileName){
    console.log('loadEDF')
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(function (response) {
        showLoading.style.display = 'none' 
        enc = new TextEncoder()
        edf_unit8 = enc.encode(response.body)
        let edf = new EDF(edf_unit8)
        edf.id = fileName
        addEdf(edf)
    })
}




// now create a function to upload file
function upload() {
    var text = document.querySelector('textarea');
    if (text.value != "") {
        const blob = new Blob([text.value], { type: 'plain/text' });
        // get parent folder id from localstorage
        const parentFolder = localStorage.getItem('parent_folder');
        var twoWords = text.value.split(' ')[0] + '-' + text.value.split(' ')[1];
        // set file metadata
        var metadata = {
            // get first two words from the input text and set as file name instead of backup-file
            name: twoWords + '-' + String(Math.random() * 10000).split('.')[0] + '.txt',
            mimeType: 'plain/text',
            parents: [parentFolder]
        };
        var formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append("file", blob);

        fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: 'POST',
            headers: new Headers({ "Authorization": "Bearer " + gapi.auth.getToken().access_token }),
            body: formData
        }).then(function (response) {
            return response.json();
        }).then(function (value) {
            console.log(value);
            // also update list on file upload
            showList();
        });
    }
}


function showCSV(fileId){
    gapi.client.drive.files.get({
        // get parent folder id from localstorage
        fileId: fileId,
        alt: 'media'
    }).then(function (response) {
        let csv_data = Papa.parse(response.body,{header:false})
        console.log(csv_data.data[0])
        console.log(response)
    })
}


// function readEditDownload(v, condition) {
//     var id = v.parentElement.getAttribute('data-id');
//     var name = v.parentElement.getAttribute('data-name');
//     v.innerHTML = '...';
//     gapi.client.drive.files.get({
//         fileId: id,
//         alt: 'media'
//     }).then(function (res) {
//         expandContainer.style.display = 'none';
//         expandContainerUl.setAttribute('data-id', '');
//         expandContainerUl.setAttribute('data-name', '');
//         if (condition == 'read') {
//             v.innerHTML = 'Read';
//             document.querySelector('textarea').value = res.body;
//             document.documentElement.scrollTop = 0;
//             console.log('Read Now')
//         } else if (condition == 'edit') {
//             v.innerHTML = 'Edit';
//             document.querySelector('textarea').value = res.body;
//             document.documentElement.scrollTop = 0;
//             var updateBtn = document.getElementsByClassName('upload')[0];
//             updateBtn.innerHTML = 'Update';
//             // we will make the update function later
//             updateBtn.setAttribute('onClick', 'update()');
//             document.querySelector('textarea').setAttribute('data-update-id', id);
//             console.log('File ready for update');
//         } else {
//             v.innerHTML = 'Download';
//             var blob = new Blob([res.body], { type: 'plain/text' });
//             var a = document.createElement('a');
//             a.href = window.URL.createObjectURL(blob);
//             a.download = name;
//             a.click();
//         }
//     })
// }

// function createFolder() {
//     var access_token = gapi.auth.getToken().access_token;
//     var request = gapi.client.request({
//         'path': 'drive/v2/files',
//         'method': 'POST',
//         'headers': {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + access_token,
//         },
//         'body': {
//             'title': 'Backup Folder',
//             'mimeType': 'application/vnd.google-apps.folder'
//         }
//     });
//     request.execute(function (response) {
//         localStorage.setItem('parent_folder', response.id);
//     })
// }

// new create update function
function update() {
    var updateId = document.querySelector('textarea').getAttribute('data-update-id');
    var url = 'https://www.googleapis.com/upload/drive/v3/files/' + updateId + '?uploadType=media';
    fetch(url, {
        method: 'PATCH',
        headers: new Headers({
            Authorization: 'Bearer ' + gapi.auth.getToken().access_token,
            'Content-type': 'plain/text'
        }),
        body: document.querySelector('textarea').value
    }).then(value => {
        console.log('File updated successfully');
        document.querySelector('textarea').setAttribute('data-update-id', '');
        var updateBtn = document.getElementsByClassName('upload')[0];
        updateBtn.innerHTML = 'Backup';
        updateBtn.setAttribute('onClick', 'uploaded()');
    }).catch(err => console.error(err))
}

function deleteFile(v) {
    var id = v.parentElement.getAttribute('data-id');
    v.innerHTML = '...';
    var request = gapi.client.drive.files.delete({
        'fileId': id
    });
    request.execute(function (res) {
        console.log('File Deleted');
        v.innerHTML = 'Delete';
        expandContainer.style.display = 'none';
        expandContainerUl.setAttribute('data-id', '');
        expandContainerUl.setAttribute('data-name', '');
        // after delete update the list
        showList();
    })
}