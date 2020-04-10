/**
 * 支持大文件上传
 * 1. 支持拆分上传请求（即切片）
 * 2. 支持断点续传；（其中某些请求失败后重新发送请求）
 * 3. 支持显示上传进度和暂停上传
 */
//当前操作用于
const user = 'fiona';
const timer = new Date().getTime();
//切片大小10M
const size = 10 * 1024 * 1024;
class Util {
    /**
     * 获取context,标识上传文件的唯一性
     */
    static getContext(file) {
            return file.name + '-' + user + '-' + timer;
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
                chunk = {
                    file: _file,
                    context: this.getContext(file),
                    index: index
                }
                fileChunkList.push(chunk);
                index++;
            }
            return fileChunkList;
        }
        //上传切片
    static uploadChunks(fileChunkList) {
        const promises = fileChunkList.map(async function(fileChunk) {
            const formData = new FormData();
            formData.append("file", fileChunk.file);
            formData.append("context", fileChunk.context);
            formData.append("index", fileChunk.index);
            $.ajax({
                url: 'http://localhost:3300/upload/bigFile',
                method: 'POST',
                processData: false,
                contentType: false,
                data: formData,
                success: function() {},
                error: function() {}
            });
        });
        Promise.all(promises).then(function(posts) {
            $.ajax({
                url: 'http://localhost:3300/upload/done',
                method: 'GET'
            })
        }).catch(function(reason) {
            throw new Error(reason);
        });
    }

}
$('#uploadBtn').on('click', function(e) {
    var file = $('#uploadFile')[0].files[0];
    var fileChunkList = Util.createFileChunks(file);
    Util.uploadChunks(fileChunkList);

});