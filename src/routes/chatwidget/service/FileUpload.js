import axios from "axios";

class FileUpload {
    constructor(url) {
        this.axios = axios.create({
            baseURL: url
        });
    }

    upload(file, url,headers=null, onProgress, cancelToken) {

        return this.axios.put(url, file, {
            headers: {
                "Content-Type": file.type,
                ...headers
            },
            cancelToken: cancelToken,
            onUploadProgress: onProgress
        });
    }

    cancelToken() {
        let CancelToken = axios.CancelToken;
        let source = CancelToken.source();
        return source
    }
}

export default FileUpload; 