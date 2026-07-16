import multer from "multer";

const mb5 = 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: mb5,
    }
});

export const extensionMap = new Map([
    ["image/png", ".png"],
    ["image/jpeg", ".jpg"],
    ["image/webp", ".webp"],
    ["image/gif", ".gif"],
]);


export default upload;