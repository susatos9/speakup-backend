"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToFirebase = void 0;
exports.uploadFileToFirebase = uploadFileToFirebase;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const speakup_final_firebase_adminsdk_fbsvc_6b947e7304_json_1 = __importDefault(require("../../speakup-final-firebase-adminsdk-fbsvc-6b947e7304.json"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(speakup_final_firebase_adminsdk_fbsvc_6b947e7304_json_1.default),
    storageBucket: 'speakup-final', // Replace with your actual bucket name
});
// Retrieve the default storage bucket:
const bucket = firebase_admin_1.default.storage().bucket();
// Alternatively, get the bucket name like this:
const bucketName = firebase_admin_1.default.app().options.storageBucket;
console.log(`Using Firebase storage bucket: ${bucketName}`);
/**
 * Uploads a file to Firebase Storage.
 * @param input - Buffer or local path of the file.
 * @param destination - Destination file name in the bucket.
 * @returns Public URL for the uploaded file.
 */
async function uploadFileToFirebase(input, destination) {
    try {
        const file = bucket.file(destination);
        if (Buffer.isBuffer(input)) {
            const writeStream = file.createWriteStream({
                metadata: {
                    contentType: 'audio/mpeg',
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        firebaseStorageDownloadTokens: undefined, // This allows public access
                    }
                },
                public: true, // Make the file public
            });
            writeStream.end(input);
            await new Promise((resolve, reject) => {
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
        }
        else {
            await bucket.upload(input, {
                destination,
                resumable: false,
                metadata: {
                    cacheControl: 'public, max-age=31536000',
                    metadata: {
                        firebaseStorageDownloadTokens: undefined, // This allows public access
                    }
                },
                public: true, // Make the file public
            });
        }
        // Generate a signed URL for public access
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        return publicUrl;
    }
    catch (error) {
        console.error('Firebase upload error:', error);
        throw new Error(`Failed to upload to Firebase: ${error.message}`);
    }
}
const writeToFirebase = async (userID, sessionID, result) => {
    try {
        const docRef = firebase_admin_1.default.firestore()
            .collection('users')
            .doc(userID)
            .collection('sessions')
            .doc(sessionID);
        // Filter out undefined values from the result
        const cleanResult = Object.fromEntries(Object.entries(result).filter(([_, value]) => value !== undefined));
        await docRef.update({
            timestamp: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            ...cleanResult
        });
        console.log('Successfully wrote to Firebase:', { userID, sessionID, result: cleanResult });
    }
    catch (error) {
        console.error('Error writing to Firebase:', error);
        throw error;
    }
};
exports.writeToFirebase = writeToFirebase;
//# sourceMappingURL=firebase.js.map