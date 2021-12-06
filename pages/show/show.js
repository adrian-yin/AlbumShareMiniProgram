// pages/show/show.js
const app = getApp();
Page({
    data: {
        albumId: '',
        pictureUrls: [],
        title: '',
        subTitle: '',
        authorID: '',
        currentPictureIndex: -1,
        changePictureInterval: null
    },
    onLoad: function (options) {
        const that = this;
        that.setData({
            albumId: options.id
        });
        // 根据相册id获取对应图片的url
        const db = wx.cloud.database();
        db.collection('albums').doc(that.data.albumId).get({
            success: res => {
                that.setData({
                    pictureUrls: res.data.pictureUrls,
                    title: res.data.title,
                    subTitle: res.data.subTitle,
                    authorID: res.data.authorID,
                    // 设置更换照片定时器
                    changePictureInterval: setInterval(that.changePicture, 8000)
                });
            }
        });
    },
    onReady: function () {
        const that = this;
        // 初始页面出现动画
        that.animate('.picture-show', [{
                opacity: 0.0,
            },
            {
                opacity: 1.0,
            }
        ], 2000, function () {});
    },
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    changePicture: function () {
        const that = this;
        // 图片消失动画
        that.animate('.picture-show', [{
                opacity: 1.0,
                rotate: 0,
                scale: [1, 1]
            },
            {
                opacity: 0.0,
                rotate: 180,
                scale: [0, 0]
            }
        ], 1000, function () {
            // 切换下一张图片
            that.setData({
                currentPictureIndex: (that.data.currentPictureIndex + 1) % that.data.pictureUrls.length
            });
            // 图片出现动画
            setTimeout(function () {
                that.animate('.picture-show', [{
                        opacity: 0.0,
                        rotate: 180,
                        scale: [0, 0]
                    },
                    {
                        opacity: 1.0,
                        rotate: 360,
                        scale: [1, 1]
                    }
                ], 2000, function () {});
            }, 1500);
        });
    },
    savePicture: function () {
        const that = this;
        if (that.data.currentPictureIndex === -1) {
            wx.showToast({
                title: '该页不能保存',
                icon: 'none'
            })
            return;
        }
        // 获取保存图片权限
        wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: res => {
                //显示保存中等待
                wx.showLoading({
                    title: '保存中...',
                });
                // 从云存储下载当前浏览图片
                wx.cloud.downloadFile({
                    fileID: that.data.pictureUrls[that.data.currentPictureIndex],
                    success: res1 => {
                        // 保存图片
                        wx.saveImageToPhotosAlbum({
                            filePath: res1.tempFilePath,
                            success: res2 => {
                                console.log('保存图片成功');
                                wx.hideLoading();
                                wx.showToast({
                                    title: '保存成功',
                                });
                            },
                            fail: res2 => {
                                console.log('保存图片失败');
                                wx.hideLoading();
                                wx.showToast({
                                  title: '保存失败',
                                  icon: 'error'
                                });
                            }
                        });
                    },
                    fail: res1 => {
                        console.log('下载图片失败');
                        wx.hideLoading();
                    }
                });
            },
            fail: res => {
                console.log('授权失败');
                wx.showToast({
                    title: '保存失败，没有权限'
                });
            }
        });
    }
})