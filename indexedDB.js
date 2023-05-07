

function initIndexedDB(dbName, storeName, version){
    console.log('initIndexedDB')
    let db
    const openRequest = indexedDB.open(dbName, version);

    openRequest.onupgradeneeded = (event) => {
    db = event.target.result;
    // Create an empty object store if object store doesn't exist
    if (!db.objectStoreNames.contains(storeName)) {
        const objectStore = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    }
    };

    openRequest.onerror = (event) => {
    console.error("Error opening database:", event.target.errorCode);
    };

    openRequest.onsuccess = (event) => {
        document.getElementById('btn_save_edf').style.display = 'block'
        console.log("Database opened successfully, empty object store created");
    }
    return db      
} 

function addEdfToDB(dbName, version, storeName, data){
    console.log(version)
    const request = indexedDB.open(dbName, version);

    request.onerror = (event) => {
        console.error('Failed to open database:', event.target.error);
        };

    request.onupgradeneeded = (event) => {
    const db = event.target.result;

    };

    request.onsuccess = (event) => {
    const db = event.target.result;

    let transaction = db.transaction(storeName, "readwrite")
    
    transaction.onerror = function(event) {
        console.log("Error adding data to the object store:", event.target.error);
      }
    
    let objectStore = transaction.objectStore(storeName);
    let addrequest = objectStore.add(data)

    addrequest.onsuccess = function(event) {
        console.log("Data added to the object store.");
    }

    transaction.oncomplete = function(event) {
        alert("All done!");
      }

    };

}

export {initIndexedDB, addEdfToDB}