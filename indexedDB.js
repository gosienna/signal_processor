

function initIndexedDB(dbName, storeName, version){
    console.log('initIndexedDB')
    let db
    const openRequest = indexedDB.open(dbName, version);

    openRequest.onupgradeneeded = (event) => {
        console.log('onupgradeneeded')
        db = event.target.result;
        // Create an empty object store if object store doesn't exist
        if (!db.objectStoreNames.contains(storeName)) {
            console.log("Creating empty object store!");
            const objectStore = db.createObjectStore(storeName, { autoIncrement: true });
        }
        document.getElementById('btn_save_edf').style.display = 'block'
    };

    openRequest.onerror = (event) => {
    console.error("Error opening database:", event.target.errorCode);
    };

    openRequest.onsuccess = (event) => {
        console.log('onsuccess')
    }
       
} 


function addEdfToDB(dbName, version, storeName, data){
    console.log('addEdfToDB',dbName, version, storeName)
    const request = indexedDB.open(dbName, version);

    request.onerror = (event) => {
        console.error('Failed to open database:', event.target.error);
        };

    request.onupgradeneeded = (event) => {
        console.log('onupgradeneeded')
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
        console.log("All done!");

        db.close();}
    };

}

function getEdfFromDB(dbName, storeName, version, id){
    console.log('getEdfToDB',dbName, version, storeName)
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onerror = (event) => {
            console.error('Failed to open database:', event.target.error);
            };

        request.onupgradeneeded = (event) => {
            console.log('onupgradeneeded')
        };

        request.onsuccess = (event) => {
        const db = event.target.result;

        let transaction = db.transaction(storeName, "readwrite")
        
        transaction.onerror = function(event) {
            console.log("Error adding data to the object store:", event.target.error);
        }
        
        let objectStore = transaction.objectStore(storeName);
        let addrequest = objectStore.get(id)

        addrequest.onsuccess = function(event) {
            if (!event.target.result) {
                reject("No data found");
            } else {
                resolve(event.target.result);
            }
        }

        transaction.oncomplete = function(event) {
            console.log("All done!");
            db.close();
        }

        };
    })
    
}


export {initIndexedDB, addEdfToDB, getEdfFromDB}