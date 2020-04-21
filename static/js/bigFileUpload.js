/**
 * 支持大文件上传
 * 1. 支持拆分上传请求（即切片）
 * 2. 支持断点续传；（其中某些请求失败后重新发送请求）
 * 3. 支持显示上传进度和暂停上传
 */

//切片大小10M
const size = 10 * 1024 * 1024;
let loaded = 0;
let requestList = [];
let uploadedList = [];
let isUploaded = false;
let fileHash;
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
                if (end > file.size - 1 && start < file.size - 1) {
                    end = file.size - 1;
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
        //验证是否已经上传
    static verifyUploaded(fileName, fileHash) {
            $.ajax({
                url: 'http://localhost:3300/upload/verify',
                method: 'GET',
                async: false,
                data: {
                    hash: fileHash,
                    fileName: fileName,
                },
                success: function(res) {
                    res = JSON.parse(res);
                    uploadedList = res.uploadedList;
                    isUploaded = res.isUploaded;
                }
            })
        }
        //获取切片上传的promises
    static getPromises(requestList, fileHash, file) {
            let promises = [];
            requestList.map(function(fileChunk) {
                let promise = new Promise(resovle => {
                    const formData = new FormData();
                    formData.append("file", fileChunk.file);
                    formData.append("index", fileChunk.index);
                    formData.append('hash', fileHash);
                    //上传切片
                    $.ajax({
                        url: 'http://localhost:3300/upload/bigFile',
                        method: 'POST',
                        processData: false,
                        contentType: false,
                        data: formData,
                        xhr: function() {
                            var xhr = $.ajaxSettings.xhr();
                            fileChunk.xhr = xhr;
                            xhr.onprogress = function e() {
                                // For downloads
                                if (e.lengthComputable) {
                                    console.log(e.loaded / e.total);
                                }
                            };
                            xhr.upload.onprogress = function(e) {
                                // For uploads
                                if (e.lengthComputable) {
                                    loaded = loaded + e.loaded;
                                    progressbar.progressbar("value", (loaded / file.size) * 100);
                                    progressLabel.text(progressbar.progressbar("value") + "%");
                                }
                            };
                            xhr.onload = e => {
                                if (requestList) {
                                    const xhrIndex = requestList.findIndex(item => item.index === chunk.inddex);
                                    requestList.splice(xhrIndex, 1);
                                }
                            }
                            return xhr;
                        },
                        success: function() {
                            resovle();
                        },
                        error: function() {}
                    });
                });
                promises.push(promise);
            });
            return promises;
        }
        //上传切片
    static async uploadChunks(fileChunkList, file) {
        if (!fileHash) {
            fileHash = await Util.calculateHash(fileChunkList);
        }
        Util.verifyUploaded(file.name, fileHash);
        if (isUploaded) {
            alert('[已经上传过]--上传成功');
            return;
        }
        const requestList = fileChunkList.filter((data) => {
            return !uploadedList.includes(fileHash + '_' + data.index);
        });
        let promises = Util.getPromises(requestList, fileHash, file);
        Promise.all(
            promises
        ).then(() => {
            //所有切片生成完以后进行切片合并
            $.ajax({
                url: 'http://localhost:3300/upload/done',
                method: 'GET',
                data: {
                    hash: fileHash,
                    fileName: file.name,
                    size: size
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
    Util.uploadChunks(fileChunkList, file);
});
$('#stopUpload').on('click', function(e) {
    for (let i = 0; i < requestList.length; i++) {
        let xhr = requestList[i].xhr;
        xhr.abort();
    }
});
$('#resumeUpload').on('click', function(e) {
    $('#uploadBtn').trigger('click');
});
let progressbar = $("#progressbar"),
    progressLabel = $(".progress-label");
progressbar.progressbar({
    value: false,
    change: function() {
        progressLabel.text(progressbar.progressbar("value") + "%");
    },
    complete: function() {
        progressLabel.text("完成！");
    }
});