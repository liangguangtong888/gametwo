/**
 * 游戏详情页通用JavaScript功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 添加body类
    document.body.classList.add('game-page');
    
    // 游戏全屏功能
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            const iframe = document.getElementById('game-iframe');
            if (iframe) {
                if (iframe.requestFullscreen) {
                    iframe.requestFullscreen();
                } else if (iframe.mozRequestFullScreen) {
                    iframe.mozRequestFullScreen();
                } else if (iframe.webkitRequestFullscreen) {
                    iframe.webkitRequestFullscreen();
                } else if (iframe.msRequestFullscreen) {
                    iframe.msRequestFullscreen();
                }
            }
        });
    }
    
    // 游戏重启功能
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            const iframe = document.getElementById('game-iframe');
            if (iframe) {
                iframe.src = iframe.src;
            }
        });
    }
    
    // 移动菜单切换
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            const navMenu = document.querySelector('nav ul');
            if (navMenu) {
                navMenu.classList.toggle('show');
            }
        });
    }
    
    // 确保图片正确加载
    function createImageCheck(url, element) {
        const img = new Image();
        img.onerror = function() {
            if (element.classList.contains('comment-avatar')) {
                element.style.backgroundImage = 'url("../../../assets/images/default-avatar.svg")';
            } else if (element.classList.contains('game-card-image')) {
                element.style.backgroundImage = 'url("../../../assets/images/game-placeholder.svg")';
            }
        };
        img.src = url;
    }
    
    // 处理用户头像
    const avatars = document.querySelectorAll('.comment-avatar');
    avatars.forEach(avatar => {
        createImageCheck('../../../assets/images/default-avatar.svg', avatar);
    });
    
    // 处理游戏卡片
    const gameCards = document.querySelectorAll('.game-card-image');
    const gameImages = [
        '../../../assets/images/game3.svg',
        '../../../assets/images/game4.svg',
        '../../../assets/images/game5.svg',
        '../../../assets/images/game6.svg'
    ];
    
    gameCards.forEach((card, index) => {
        if (index < gameImages.length) {
            card.style.backgroundImage = `url("${gameImages[index]}")`;
            createImageCheck(gameImages[index], card);
        } else {
            card.style.backgroundImage = 'url("../../../assets/images/game-placeholder.svg")';
        }
    });
}); 