/**
 * 支持大文件上传
 * 1. 支持拆分上传请求（即切片）
 * 2. 支持断点续传；（其中某些请求失败后重新发送请求）
 * 3. 支持显示上传进度和暂停上传
 */

//切片大小10M
const size = 10 * 1024 * 1024;
class Util {  
    // 生成文件 hash（web-worker）   
    static calculateHash(fileChunkList) {      
        return new Promise(resolve => {
            // 添加 worker 属性
            let worker = new Worker("./util/hash.js");
            worker.postMessage({ fileChunkList });
            worker.onmessage = e => {
                const { percentage, hash } = e.data;
                this.hashPercentage = percentage;
                if (hash) {
                    resolve(hash);
                }
            };
        });
    }
        /**
         * 生成文件切片
         */
    static createFileChunks(file) {
            const fileChunkList = [];
            let start = 0,
                end = size,
                index = 0;
            while (end < file.size) {
                let chunk;
                let _file = file.slice(start, end);
                start = end;
                end = end + size;
                if(end>file.size-1 && start<file.size-1){
                    end = file.size-1;
                }
                chunk = {
                    file: _file,                   
                    index: index
                }
                fileChunkList.push(chunk);
                index++;
            }
            return fileChunkList;
        }
        //上传切片
    static async uploadChunks(fileChunkList,file) {
        var fileHash = await Util.calculateHash(fileChunkList);
        Promise.all(
            fileChunkList.map(function(fileChunk) {
                new Promise(resovle=>{
                    const formData = new FormData();
                    formData.append("file", fileChunk.file);  
                    formData.append("index", fileChunk.index);
                    formData.append('hash',fileHash);
                    //上传切片
                    $.ajax({
                        url: 'http://localhost:3300/upload/bigFile',
                        method: 'POST',
                        processData: false,
                        contentType: false,
                        data: formData,
                        xhr: function () {
                            var xhr = $.ajaxSettings.xhr();
                            xhr.onprogress = function e() {
                                // For downloads
                                if (e.lengthComputable) {
                                    console.log(e.loaded / e.total);
                                }
                            };
                            xhr.upload.onprogress = function (e) {
                                // For uploads
                                if (e.lengthComputable) {
                                    console.log(e.loaded / file.size);
                                }
                            };
                            return xhr;
                        },                    
                        success: function() {
                            resovle();
                        },
                        error: function() {}
                    });
                });          
            })
        ).then(()=>{
            //所有切片生成完以后进行切片合并
            $.ajax({
                url: 'http://localhost:3300/upload/done',
                method: 'GET',
                data:{
                    hash:fileHash,
                    fileName:file.name,
                    size:size
                }
            })
        }).catch(function(reason) {
            throw new Error(reason);
        });
    }

}
$('#uploadBtn').on('click', function(e) {
    var file = $('#uploadFile')[0].files[0];
    var fileChunkList = Util.createFileChunks(file);    
    Util.uploadChunks(fileChunkList,file);

});