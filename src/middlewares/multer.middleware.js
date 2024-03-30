import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    },
    // fieldSize: function(req, file, cb) {
    //     cb(null, "1MB")
    // }
})

export const upload = multer({
    storage
})