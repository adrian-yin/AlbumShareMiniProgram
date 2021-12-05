// pages/create/create.js
const app = getApp();
Page({
    data: {
        currentPictureNum: 0,
        maxPictureNum: 9,
        picturesPath: [],
        title: '我的相册',
        subTitle: ''
    },
    // 选择图片
    addPicture: function () {
        const that = this;
        wx.chooseImage({
            count: that.data.maxPictureNum - that.data.currentPictureNum,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: res => {
                console.log('选择图片成功');
                that.setData({
                    picturesPath: that.data.picturesPath.concat(res.tempFilePaths),
                    currentPictureNum: that.data.currentPictureNum + res.tempFilePaths.length
                });
            },
            fail: res => {
                console.log('选择图片失败');
            }
        });
    },
    // 长按删除照片
    deletePicture: function(e) {
        const that = this;
        wx.showModal({
            title: '删除图片',
            content: '确定删除这张图片吗？',
            confirmColor: '#000000',
            success: res => {
                if (res.confirm) {
                    console.log('删除图片');
                    const newPicturesPath = that.data.picturesPath;
                    newPicturesPath.splice(e.target.dataset.index, 1);
                    that.setData({
                        picturesPath: newPicturesPath
                    });
                    currentPictureNum--;
                }
            }
        })
    },
    // 生成相册
    generateAlbum: function() {
        const that = this;
        if (that.data.currentPictureNum <= 0) {
            wx.showModal({
                content: '请至少添加一张图片',
                showCancel: false
            });
            return;
        }
        if (that.data.title === '') {
            that.setData({
                title: '我的相册'
            });
        }
        wx.showLoading({
          title: '正在生成...',
        });
        // 批量上传图片
        const uploadPictures = that.data.picturesPath.map(item => that.uploadPicture(item));
        Promise.all(uploadPictures).then(res => {
            const pictureUrls = [];
            for (let file in res) {
                pictureUrls.push(res[file].fileID);
            }
            // 将相册写入数据库
            const db = wx.cloud.database();
            db.collection('albums').add({
                data: {
                    title: that.data.title,
                    subTitle: that.data.subTitle,
                    authorID: app.globalData.openID,
                    pictureUrls: pictureUrls
                },
                success: res => {
                    wx.hideLoading();
                    // 跳转到刚创建的相册展示页面
                    wx.navigateTo({
                        url: '/pages/show/show?id=' + res._id
                    });
                }
            });
        }).catch(error => {
            wx.hideLoading();
            wx.showToast({
                title: '生成相册失败'
            });
        });
    },
    // 上传图片
    uploadPicture: function(path) {
        return wx.cloud.uploadFile({
            cloudPath: `${Date.now()}-${Math.floor(Math.random(0, 1) * 10000000)}.png`,
            filePath: path,
        });
    }
});