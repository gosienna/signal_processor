

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
            const objectStore = db.createObjectStore(storeName, { autoIncrement: false });
        }
    };

    openRequest.onerror = (event) => {
    console.error("Error opening database:", event.target.errorCode);
    };

    openRequest.onsuccess = (event) => {
        console.log('onsuccess')
    }
       
} 


function putDataToDB(dbName, version, storeName, data, key){
    console.log('addCSVToDB',dbName, version, storeName)
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
    let addrequest = objectStore.put(data, key)

    addrequest.onsuccess = function(event) {
        console.log("Data added to the object store.");
    }

    transaction.oncomplete = function(event) {
        console.log("All done!");

        db.close();}
    };

}

function getDataFromDB(dbName, storeName, version, id){
    console.log('getCSVToDB',dbName, version, storeName)
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
                resolve(event.target.result); //return the csv string
            }
        }

        transaction.oncomplete = function(event) {
            console.log("All done!");
            db.close();
        }

        };
    })
    
}


export {initIndexedDB, putDataToDB, getDataFromDB}