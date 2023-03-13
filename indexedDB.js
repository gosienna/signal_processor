
const dbName = 'edfDatabase'
const dbVersion = 1
function openDB(){

    // Open a connection to the database
    const request = indexedDB.open(dbName, dbVersion);

    // Create the object stores when upgrading the database version
    request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // Create an object store named "users" with an auto-incrementing key
        const usersStore = db.createObjectStore("edf", { keyPath: "id" });
        console.log(db)
    };

        // Handle errors when opening the database
    request.onerror = event => {
        console.log("Error opening database:", event.target.error);
    };

    // Handle success when opening the database
    request.onsuccess = event => {
        const db = event.target.result;
        document.getElementById('btn_save_edf').style.display = 'block'
    };
    
}

function addEdf(data){
    const request = indexedDB.open(dbName);
    // Handle errors when opening the database
    request.onerror = event => {
        console.log("Error opening database:", event.target.error);
    };
    
    // Handle success when opening the database
    request.onsuccess = event => {
        const db = event.target.result;
        
        // Create a transaction to read data from the "users" object store
        const transaction = db.transaction("edf", "readwrite")
        const objectStore = transaction.objectStore("edf");
        const addrequest = objectStore.add(data)
        addrequest.onerror = event => {
            console.log("Error adding data to the object store:", event.target.error);
        };
        addrequest.onsuccess = event => {
            console.log("Data added to the object store.");
        };
        
    };
}