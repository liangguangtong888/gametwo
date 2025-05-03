/**
 * 游戏乐园网站主JS文件
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化搜索功能
    initSearch();
    
    // 初始化懒加载图片
    initLazyLoad();
    
    // 初始化移动端导航
    initMobileNav();
    
    // 初始化返回顶部按钮
    initBackToTop();
    
    // 初始化特色游戏滑块
    initFeaturedSlider();
    
    // 初始化平滑滚动到锚点
    initSmoothScroll();
});

/**
 * 初始化搜索功能
 */
function initSearch() {
    const searchBox = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.search-box button');
    
    if (!searchBox || !searchBtn) return;
    
    searchBtn.addEventListener('click', function() {
        performSearch(searchBox.value);
    });
    
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(searchBox.value);
        }
    });
}

/**
 * 执行搜索
 * @param {string} query - 搜索关键词
 */
function performSearch(query) {
    if (!query.trim()) return;
    
    // 简单的搜索重定向，实际应用中可以改为异步搜索或其他方式
    window.location.href = `search-results.html?q=${encodeURIComponent(query.trim())}`;
}

/**
 * 初始化图片懒加载
 */
function initLazyLoad() {
    // 检查浏览器是否支持 IntersectionObserver
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.removeAttribute('data-src');
                    imageObserver.unobserve(image);
                }
            });
        });
        
        lazyImages.forEach(function(image) {
            imageObserver.observe(image);
        });
    } else {
        // 回退方案：简单滚动监听
        const lazyLoad = function() {
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            lazyImages.forEach(function(img) {
                if (isInViewport(img)) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        };
        
        // 初始检查
        lazyLoad();
        
        // 添加滚动监听
        window.addEventListener('scroll', lazyLoad);
        window.addEventListener('resize', lazyLoad);
    }
}

/**
 * 检查元素是否在视口中
 * @param {HTMLElement} element - 要检查的元素
 * @returns {boolean} - 元素是否在视口中
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * 初始化移动端导航
 */
function initMobileNav() {
    // 这里实现一个简单的移动端汉堡菜单
    // 首先检查页面上是否已经有了汉堡菜单按钮
    if (!document.querySelector('.mobile-menu-toggle')) {
        // 创建汉堡菜单图标和按钮
        const header = document.querySelector('header .container');
        if (!header) return;
        
        const mobileMenuToggle = document.createElement('button');
        mobileMenuToggle.className = 'mobile-menu-toggle';
        mobileMenuToggle.innerHTML = '<span></span><span></span><span></span>';
        
        // 在小屏幕时显示菜单按钮
        const style = document.createElement('style');
        style.textContent = `
            .mobile-menu-toggle {
                display: none;
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
            }
            
            .mobile-menu-toggle span {
                display: block;
                width: 25px;
                height: 3px;
                background-color: #333;
                margin: 5px 0;
                transition: all 0.3s ease;
            }
            
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: block;
                    order: -1;
                }
                
                nav ul {
                    display: none;
                    flex-direction: column;
                    width: 100%;
                }
                
                nav ul.active {
                    display: flex;
                }
                
                .mobile-menu-toggle.active span:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                }
                
                .mobile-menu-toggle.active span:nth-child(2) {
                    opacity: 0;
                }
                
                .mobile-menu-toggle.active span:nth-child(3) {
                    transform: rotate(-45deg) translate(7px, -7px);
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // 将按钮添加到导航栏
        header.prepend(mobileMenuToggle);
        
        // 添加点击事件
        mobileMenuToggle.addEventListener('click', function() {
            const navMenu = document.querySelector('nav ul');
            if (navMenu) {
                navMenu.classList.toggle('active');
                this.classList.toggle('active');
            }
        });
    }
    
    // 添加移动菜单切换功能
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', function() {
            const navUl = document.querySelector('nav ul');
            if (navUl) {
                navUl.classList.toggle('show');
            }
        });
    }
}

/**
 * 初始化返回顶部按钮
 */
function initBackToTop() {
    // 创建返回顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .back-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background-color: #ff6b6b;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
            z-index: 99;
        }
        
        .back-to-top.visible {
            opacity: 0.7;
            visibility: visible;
        }
        
        .back-to-top:hover {
            opacity: 1;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(backToTopBtn);
    
    // 监听滚动事件，显示/隐藏按钮
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * 初始化特色游戏滑块
 */
function initFeaturedSlider() {
    const slides = document.querySelectorAll('.game-slide');
    if (!slides.length) return;
    
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? 'block' : 'none';
        });
    }
    
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
    }
    
    // 初始化滑块
    showSlide(currentSlide);
    
    // 自动切换（每5秒）
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);
}

/**
 * 初始化平滑滚动到锚点
 */
function initSmoothScroll() {
    // 获取所有带有锚点的链接
    const anchorLinks = document.querySelectorAll('a[href^="categories.html#"]');
    
    // 为每个锚点链接添加点击事件
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 如果在相同页面，平滑滚动到目标位置
            if(window.location.pathname.includes('categories.html')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').split('#')[1];
                const targetElement = document.getElementById(targetId);
                
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // 调整滚动位置，考虑顶部固定导航栏
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
} 