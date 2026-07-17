import type { ErrorRequestHandler } from "express";
import multer from "multer";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    if(err instanceof multer.MulterError) {
        if(err.code === "LIMIT_FILE_SIZE"){
            res.status(400).json({error: "Image must be smaller than 5 MB"});
            return;
        }

        res.status(400).json({error: err.message});
        return
    }

    res.status(500).json({error: "Internal server error"});
}

export default errorHandler;