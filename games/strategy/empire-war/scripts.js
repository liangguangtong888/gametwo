// Empire War 游戏逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 游戏状态变量
    const gameState = {
        resources: {
            gold: 500,
            food: 200,
            wood: 300,
            population: 5,
            maxPopulation: 10
        },
        map: {
            width: 20,
            height: 15,
            tileSize: 60,
            offsetX: 0,
            offsetY: 0
        },
        buildings: [],
        units: [],
        enemies: [],
        selectedEntity: null,
        buildMode: false,
        buildingType: null,
        gameStarted: false,
        gameTick: 0,
        gameSpeed: 1000, // 游戏速度（毫秒）
        enemySpawnRate: 30, // 每30个tick生成一个敌人
        activeAI: true
    };
    
    // DOM元素
    const gameMap = document.getElementById('game-map');
    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');
    const buildMenu = document.getElementById('build-menu');
    const messageBox = document.getElementById('message-box');
    const loadingScreen = document.querySelector('.loading-screen');
    const loadingProgress = document.querySelector('.loading-progress');
    const startButton = document.querySelector('.start-button');
    
    // 初始化游戏地图
    function initializeMap() {
        // 清空地图
        gameMap.innerHTML = '';
        
        // 创建地图瓦片
        for (let y = 0; y < gameState.map.height; y++) {
            for (let x = 0; x < gameState.map.width; x++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.x = x;
                tile.dataset.y = y;
                
                // 为瓦片设置随机地形
                const terrainType = getRandomTerrain();
                tile.classList.add(terrainType);
                
                // 根据偏移设置位置
                updateTilePosition(tile, x, y);
                
                // 添加点击事件
                tile.addEventListener('click', function(e) {
                    handleTileClick(x, y, e);
                });
                
                gameMap.appendChild(tile);
            }
        }
        
        // 设置玩家的初始城堡，位于地图左侧
        createBuilding('castle', 2, Math.floor(gameState.map.height / 2), true);
        
        // 设置敌人的初始城堡，位于地图右侧
        createBuilding('castle', gameState.map.width - 3, Math.floor(gameState.map.height / 2), false);
        
        // 初始化小地图
        updateMinimap();
    }
    
    // 更新瓦片位置
    function updateTilePosition(tile, x, y) {
        const posX = x * gameState.map.tileSize + gameState.map.offsetX;
        const posY = y * gameState.map.tileSize + gameState.map.offsetY;
        
        tile.style.left = posX + 'px';
        tile.style.top = posY + 'px';
    }
    
    // 获取随机地形类型
    function getRandomTerrain() {
        const terrains = ['grass', 'grass', 'grass', 'grass', 'forest', 'forest', 'water', 'mountain'];
        const randomIndex = Math.floor(Math.random() * terrains.length);
        return terrains[randomIndex];
    }
    
    // 处理瓦片点击事件
    function handleTileClick(x, y, event) {
        // 如果在建造模式
        if (gameState.buildMode && gameState.buildingType) {
            attemptToBuild(gameState.buildingType, x, y);
            gameState.buildMode = false;
            gameState.buildingType = null;
            buildMenu.style.display = 'none';
            return;
        }
        
        // 如果选中了单位，则移动单位
        if (gameState.selectedEntity && gameState.selectedEntity.type === 'unit') {
            moveUnit(gameState.selectedEntity, x, y);
            return;
        }
        
        // 检查是否点击了单位或建筑
        const entity = getEntityAtPosition(x, y);
        if (entity) {
            selectEntity(entity);
        } else {
            // 清除选择
            clearSelection();
        }
    }
    
    // 尝试建造建筑
    function attemptToBuild(buildingType, x, y) {
        // 检查地形是否允许建造
        const tileElement = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
        if (!tileElement || tileElement.classList.contains('water') || tileElement.classList.contains('mountain')) {
            showMessage("Cannot build on this terrain");
            return false;
        }
        
        // 检查是否有足够的资源
        const costs = getBuildingCosts(buildingType);
        if (gameState.resources.gold < costs.gold || gameState.resources.wood < costs.wood) {
            showMessage("Not enough resources");
            return false;
        }
        
        // 检查该位置是否已有建筑或单位
        if (getEntityAtPosition(x, y)) {
            showMessage("This location is occupied");
            return false;
        }
        
        // 扣除资源
        gameState.resources.gold -= costs.gold;
        gameState.resources.wood -= costs.wood;
        
        // 创建建筑
        createBuilding(buildingType, x, y, true);
        
        // 更新资源显示
        updateResourceDisplay();
        
        showMessage(`${buildingType.charAt(0).toUpperCase() + buildingType.slice(1)} built successfully`);
        return true;
    }
    
    // 获取建筑成本
    function getBuildingCosts(buildingType) {
        switch (buildingType) {
            case 'castle':
                return { gold: 300, wood: 200 };
            case 'barracks':
                return { gold: 150, wood: 100 };
            case 'mine':
                return { gold: 100, wood: 50 };
            case 'farm':
                return { gold: 50, wood: 100 };
            default:
                return { gold: 0, wood: 0 };
        }
    }
    
    // 创建建筑
    function createBuilding(buildingType, x, y, isPlayer) {
        const building = document.createElement('div');
        building.className = `building ${buildingType}`;
        
        // 设置位置
        const posX = x * gameState.map.tileSize + gameState.map.offsetX;
        const posY = y * gameState.map.tileSize + gameState.map.offsetY;
        building.style.left = posX + 5 + 'px'; // 居中
        building.style.top = posY + 5 + 'px';
        
        // 设置所属方
        if (!isPlayer) {
            building.style.backgroundColor = '#f44336';
            building.style.borderColor = '#d32f2f';
        }
        
        // 添加建筑属性
        building.dataset.x = x;
        building.dataset.y = y;
        building.dataset.type = 'building';
        building.dataset.buildingType = buildingType;
        building.dataset.isPlayer = isPlayer;
        
        // 添加点击事件
        building.addEventListener('click', function(e) {
            e.stopPropagation();
            const entity = {
                type: 'building',
                buildingType: buildingType,
                element: building,
                x: x,
                y: y,
                isPlayer: isPlayer
            };
            selectEntity(entity);
        });
        
        // 添加到地图
        gameMap.appendChild(building);
        
        // 添加到游戏状态
        const buildingObj = {
            type: 'building',
            buildingType: buildingType,
            element: building,
            x: x,
            y: y,
            isPlayer: isPlayer,
            health: 100
        };
        
        // 如果是城堡，增加人口上限
        if (buildingType === 'castle' && isPlayer) {
            gameState.resources.maxPopulation += 10;
            updateResourceDisplay();
        }
        
        // 如果是玩家的农场，增加食物生产
        if (buildingType === 'farm' && isPlayer) {
            buildingObj.productionType = 'food';
            buildingObj.productionRate = 5;
        }
        
        // 如果是玩家的矿场，增加金币生产
        if (buildingType === 'mine' && isPlayer) {
            buildingObj.productionType = 'gold';
            buildingObj.productionRate = 5;
        }
        
        gameState.buildings.push(buildingObj);
        
        // 更新小地图
        updateMinimap();
        
        return buildingObj;
    }
    
    // 创建单位
    function createUnit(unitType, x, y, isPlayer) {
        // 检查人口上限
        if (isPlayer && gameState.resources.population >= gameState.resources.maxPopulation) {
            showMessage("Population limit reached");
            return null;
        }
        
        // 检查是否有足够资源
        const costs = getUnitCosts(unitType);
        if (isPlayer && (gameState.resources.gold < costs.gold || gameState.resources.food < costs.food)) {
            showMessage("Not enough resources");
            return null;
        }
        
        // 扣除资源
        if (isPlayer) {
            gameState.resources.gold -= costs.gold;
            gameState.resources.food -= costs.food;
            gameState.resources.population += 1;
            updateResourceDisplay();
        }
        
        const unit = document.createElement('div');
        unit.className = `unit ${isPlayer ? 'player' : 'enemy'}`;
        
        // 根据单位类型添加特性
        unit.dataset.unitType = unitType;
        
        // 设置位置
        const posX = x * gameState.map.tileSize + gameState.map.offsetX;
        const posY = y * gameState.map.tileSize + gameState.map.offsetY;
        unit.style.left = posX + 15 + 'px'; // 居中
        unit.style.top = posY + 15 + 'px';
        
        // 添加单位属性
        unit.dataset.x = x;
        unit.dataset.y = y;
        unit.dataset.type = 'unit';
        unit.dataset.isPlayer = isPlayer;
        
        // 获取单位属性
        const unitStats = getUnitStats(unitType);
        
        // 添加点击事件
        unit.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!isPlayer) return; // 只能选择自己的单位
            
            const entity = {
                type: 'unit',
                unitType: unitType,
                element: unit,
                x: x,
                y: y,
                isPlayer: isPlayer,
                targetX: null,
                targetY: null,
                health: unitStats.health,
                attack: unitStats.attack,
                range: unitStats.range,
                speed: unitStats.speed
            };
            selectEntity(entity);
        });
        
        // 添加到地图
        gameMap.appendChild(unit);
        
        // 添加到游戏状态
        const unitObj = {
            type: 'unit',
            unitType: unitType,
            element: unit,
            x: x,
            y: y,
            isPlayer: isPlayer,
            targetX: null,
            targetY: null,
            health: unitStats.health,
            attack: unitStats.attack,
            range: unitStats.range,
            speed: unitStats.speed,
            lastMoved: 0
        };
        
        if (isPlayer) {
            gameState.units.push(unitObj);
        } else {
            gameState.enemies.push(unitObj);
        }
        
        // 更新小地图
        updateMinimap();
        
        showMessage(`${unitType.charAt(0).toUpperCase() + unitType.slice(1)} created`);
        return unitObj;
    }
    
    // 获取单位成本
    function getUnitCosts(unitType) {
        switch (unitType) {
            case 'warrior':
                return { gold: 100, food: 50 };
            case 'archer':
                return { gold: 120, food: 40 };
            case 'cavalry':
                return { gold: 200, food: 80 };
            case 'catapult':
                return { gold: 300, food: 0, wood: 100 };
            default:
                return { gold: 0, food: 0 };
        }
    }
    
    // 获取单位属性
    function getUnitStats(unitType) {
        switch (unitType) {
            case 'warrior':
                return { health: 100, attack: 10, range: 1, speed: 1 };
            case 'archer':
                return { health: 70, attack: 15, range: 3, speed: 1 };
            case 'cavalry':
                return { health: 120, attack: 12, range: 1, speed: 2 };
            case 'catapult':
                return { health: 60, attack: 30, range: 4, speed: 0.5 };
            default:
                return { health: 100, attack: 10, range: 1, speed: 1 };
        }
    }
    
    // 移动单位
    function moveUnit(unit, targetX, targetY) {
        // 更新单位目标位置
        unit.targetX = targetX;
        unit.targetY = targetY;
        
        // 更新UI显示
        showMessage(`Moving unit to (${targetX}, ${targetY})`);
    }
    
    // 获取指定位置的实体（建筑或单位）
    function getEntityAtPosition(x, y) {
        // 检查是否有建筑
        for (const building of gameState.buildings) {
            if (building.x === x && building.y === y) {
                return building;
            }
        }
        
        // 检查是否有单位
        for (const unit of gameState.units) {
            if (Math.floor(unit.x) === x && Math.floor(unit.y) === y) {
                return unit;
            }
        }
        
        // 检查是否有敌人
        for (const enemy of gameState.enemies) {
            if (Math.floor(enemy.x) === x && Math.floor(enemy.y) === y) {
                return enemy;
            }
        }
        
        return null;
    }
    
    // 选择实体
    function selectEntity(entity) {
        // 清除之前的选择
        clearSelection();
        
        // 设置新的选择
        gameState.selectedEntity = entity;
        
        // 高亮显示选中实体
        if (entity.element) {
            entity.element.classList.add('selected');
        }
        
        // 更新选择信息显示
        updateSelectionInfo(entity);
    }
    
    // 清除选择
    function clearSelection() {
        if (gameState.selectedEntity && gameState.selectedEntity.element) {
            gameState.selectedEntity.element.classList.remove('selected');
        }
        gameState.selectedEntity = null;
        document.getElementById('selection-info').innerHTML = '';
    }
    
    // 更新选择信息显示
    function updateSelectionInfo(entity) {
        const selectionInfo = document.getElementById('selection-info');
        
        if (entity.type === 'building') {
            selectionInfo.innerHTML = `
                <h4>${entity.buildingType.charAt(0).toUpperCase() + entity.buildingType.slice(1)}</h4>
                <p>Health: ${entity.health}/100</p>
                ${entity.isPlayer ? '<p>Your building</p>' : '<p>Enemy building</p>'}
            `;
            
            // 如果是兵营且是玩家的，显示训练按钮
            if (entity.buildingType === 'barracks' && entity.isPlayer) {
                selectionInfo.innerHTML += `
                    <button id="train-warrior">Train Warrior</button>
                    <button id="train-archer">Train Archer</button>
                    <button id="train-cavalry">Train Cavalry</button>
                `;
                
                // 添加训练按钮事件
                setTimeout(() => {
                    document.getElementById('train-warrior')?.addEventListener('click', () => trainUnit('warrior', entity.x, entity.y));
                    document.getElementById('train-archer')?.addEventListener('click', () => trainUnit('archer', entity.x, entity.y));
                    document.getElementById('train-cavalry')?.addEventListener('click', () => trainUnit('cavalry', entity.x, entity.y));
                }, 0);
            }
        } else if (entity.type === 'unit') {
            selectionInfo.innerHTML = `
                <h4>${entity.unitType.charAt(0).toUpperCase() + entity.unitType.slice(1)}</h4>
                <p>Health: ${entity.health}/${getUnitStats(entity.unitType).health}</p>
                <p>Attack: ${entity.attack}</p>
                <p>Range: ${entity.range}</p>
                <p>Speed: ${entity.speed}</p>
                ${entity.isPlayer ? '<p>Your unit</p>' : '<p>Enemy unit</p>'}
            `;
        }
    }
    
    // 训练单位
    function trainUnit(unitType, x, y) {
        // 在兵营旁边找一个空位置
        const positions = [
            { x: x+1, y: y }, { x: x-1, y: y },
            { x: x, y: y+1 }, { x: x, y: y-1 }
        ];
        
        for (const pos of positions) {
            if (pos.x >= 0 && pos.x < gameState.map.width && 
                pos.y >= 0 && pos.y < gameState.map.height) {
                
                const tileElement = document.querySelector(`.tile[data-x="${pos.x}"][data-y="${pos.y}"]`);
                if (!tileElement.classList.contains('water') && !tileElement.classList.contains('mountain')) {
                    if (!getEntityAtPosition(pos.x, pos.y)) {
                        createUnit(unitType, pos.x, pos.y, true);
                        return;
                    }
                }
            }
        }
        
        showMessage("No space to place unit");
    }
    
    // 更新小地图
    function updateMinimap() {
        // 设置小地图尺寸
        minimapCanvas.width = 180;
        minimapCanvas.height = 180;
        
        // 清除小地图
        minimapCtx.fillStyle = '#e8e0d5';
        minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // 计算比例
        const scaleX = minimapCanvas.width / (gameState.map.width * gameState.map.tileSize);
        const scaleY = minimapCanvas.height / (gameState.map.height * gameState.map.tileSize);
        
        // 绘制地形
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            const x = parseInt(tile.dataset.x);
            const y = parseInt(tile.dataset.y);
            
            // 根据地形类型设置颜色
            let color = '#a5d6a7'; // 默认为草地
            if (tile.classList.contains('water')) color = '#90caf9';
            if (tile.classList.contains('mountain')) color = '#bcaaa4';
            if (tile.classList.contains('forest')) color = '#66bb6a';
            
            minimapCtx.fillStyle = color;
            minimapCtx.fillRect(
                x * gameState.map.tileSize * scaleX,
                y * gameState.map.tileSize * scaleY,
                gameState.map.tileSize * scaleX,
                gameState.map.tileSize * scaleY
            );
        });
        
        // 绘制建筑
        gameState.buildings.forEach(building => {
            minimapCtx.fillStyle = building.isPlayer ? '#2196f3' : '#f44336';
            minimapCtx.fillRect(
                building.x * gameState.map.tileSize * scaleX,
                building.y * gameState.map.tileSize * scaleY,
                gameState.map.tileSize * scaleX,
                gameState.map.tileSize * scaleY
            );
        });
        
        // 绘制单位
        gameState.units.forEach(unit => {
            minimapCtx.fillStyle = '#2196f3';
            minimapCtx.beginPath();
            minimapCtx.arc(
                (unit.x * gameState.map.tileSize + gameState.map.tileSize/2) * scaleX,
                (unit.y * gameState.map.tileSize + gameState.map.tileSize/2) * scaleY,
                3, 0, Math.PI * 2
            );
            minimapCtx.fill();
        });
        
        // 绘制敌人
        gameState.enemies.forEach(enemy => {
            minimapCtx.fillStyle = '#f44336';
            minimapCtx.beginPath();
            minimapCtx.arc(
                (enemy.x * gameState.map.tileSize + gameState.map.tileSize/2) * scaleX,
                (enemy.y * gameState.map.tileSize + gameState.map.tileSize/2) * scaleY,
                3, 0, Math.PI * 2
            );
            minimapCtx.fill();
        });
    }
    
    // 更新资源显示
    function updateResourceDisplay() {
        document.getElementById('gold').textContent = gameState.resources.gold;
        document.getElementById('food').textContent = gameState.resources.food;
        document.getElementById('wood').textContent = gameState.resources.wood;
        document.getElementById('population').textContent = `${gameState.resources.population}/${gameState.resources.maxPopulation}`;
    }
    
    // 显示消息
    function showMessage(message) {
        messageBox.textContent = message;
        messageBox.classList.add('visible');
        
        setTimeout(() => {
            messageBox.classList.remove('visible');
        }, 3000);
    }
    
    // 游戏初始化
    function initializeGame() {
        // 初始化地图
        initializeMap();
        
        // 初始化资源显示
        updateResourceDisplay();
        
        // 初始化事件监听器
        initializeEventListeners();
        
        // 加载完成后，显示开始按钮
        startButton.style.display = 'block';
        
        // 开始按钮点击事件
        startButton.addEventListener('click', startGame);
    }
    
    // 初始化事件监听器
    function initializeEventListeners() {
        // 建造按钮点击事件
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.dataset.building === 'true') {
                    // 显示建筑菜单
                    buildMenu.style.display = 'flex';
                    buildMenu.style.left = (this.getBoundingClientRect().left) + 'px';
                    buildMenu.style.top = (this.getBoundingClientRect().top - buildMenu.offsetHeight - 10) + 'px';
                } else {
                    // 训练单位
                    const unitType = this.dataset.unit;
                    
                    // 找到玩家的兵营
                    const barracks = gameState.buildings.find(b => b.buildingType === 'barracks' && b.isPlayer);
                    
                    if (barracks) {
                        trainUnit(unitType, barracks.x, barracks.y);
                    } else {
                        showMessage("You need a barracks to train units");
                    }
                }
            });
        });
        
        // 建筑选项点击事件
        document.querySelectorAll('.build-option').forEach(option => {
            option.addEventListener('click', function() {
                gameState.buildMode = true;
                gameState.buildingType = this.dataset.building;
                buildMenu.style.display = 'none';
                showMessage(`Select a location to build ${gameState.buildingType}`);
            });
        });
        
        // 点击其他地方关闭建筑菜单
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.unit-btn') && !e.target.closest('.build-menu')) {
                buildMenu.style.display = 'none';
            }
        });
        
        // 小地图点击事件
        minimapCanvas.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算比例
            const scaleX = minimapCanvas.width / (gameState.map.width * gameState.map.tileSize);
            const scaleY = minimapCanvas.height / (gameState.map.height * gameState.map.tileSize);
            
            // 计算地图位置
            const mapX = Math.floor(x / scaleX / gameState.map.tileSize);
            const mapY = Math.floor(y / scaleY / gameState.map.tileSize);
            
            // 聚焦地图
            focusMap(mapX, mapY);
        });
        
        // 地图拖动事件
        let isDragging = false;
        let lastX, lastY;
        
        gameMap.addEventListener('mousedown', function(e) {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            gameMap.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                
                gameState.map.offsetX += dx;
                gameState.map.offsetY += dy;
                
                updateMapPosition();
                
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });
        
        document.addEventListener('mouseup', function() {
            isDragging = false;
            gameMap.style.cursor = 'default';
        });
    }
    
    // 更新地图位置
    function updateMapPosition() {
        // 更新瓦片位置
        document.querySelectorAll('.tile').forEach(tile => {
            const x = parseInt(tile.dataset.x);
            const y = parseInt(tile.dataset.y);
            updateTilePosition(tile, x, y);
        });
        
        // 更新建筑位置
        document.querySelectorAll('.building').forEach(building => {
            const x = parseInt(building.dataset.x);
            const y = parseInt(building.dataset.y);
            const posX = x * gameState.map.tileSize + gameState.map.offsetX;
            const posY = y * gameState.map.tileSize + gameState.map.offsetY;
            building.style.left = posX + 5 + 'px';
            building.style.top = posY + 5 + 'px';
        });
        
        // 更新单位位置
        document.querySelectorAll('.unit').forEach(unit => {
            const x = parseInt(unit.dataset.x);
            const y = parseInt(unit.dataset.y);
            const posX = x * gameState.map.tileSize + gameState.map.offsetX;
            const posY = y * gameState.map.tileSize + gameState.map.offsetY;
            unit.style.left = posX + 15 + 'px';
            unit.style.top = posY + 15 + 'px';
        });
    }
    
    // 聚焦地图
    function focusMap(x, y) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        gameState.map.offsetX = centerX - x * gameState.map.tileSize - gameState.map.tileSize / 2;
        gameState.map.offsetY = centerY - y * gameState.map.tileSize - gameState.map.tileSize / 2;
        
        updateMapPosition();
    }
    
    // 开始游戏
    function startGame() {
        // 隐藏加载屏幕
        loadingScreen.style.display = 'none';
        
        // 设置游戏状态为已开始
        gameState.gameStarted = true;
        
        // 开始游戏循环
        gameLoop();
    }
    
    // 游戏循环
    function gameLoop() {
        if (!gameState.gameStarted) return;
        
        // 更新游戏状态
        updateGameState();
        
        // 进行游戏计时
        gameState.gameTick++;
        
        // 更新单位
        updateUnits();
        
        // 更新建筑
        updateBuildings();
        
        // 生成敌人
        if (gameState.gameTick % gameState.enemySpawnRate === 0 && gameState.activeAI) {
            spawnEnemy();
        }
        
        // 检查胜利/失败条件
        checkGameEnd();
        
        // 更新小地图
        updateMinimap();
        
        // 更新选择信息
        if (gameState.selectedEntity) {
            updateSelectionInfo(gameState.selectedEntity);
        }
        
        // 继续游戏循环
        setTimeout(gameLoop, gameState.gameSpeed);
    }
    
    // 更新游戏状态
    function updateGameState() {
        // 更新资源生产
        gameState.buildings.forEach(building => {
            if (building.isPlayer && building.productionType) {
                gameState.resources[building.productionType] += building.productionRate;
            }
        });
        
        // 更新资源显示
        updateResourceDisplay();
    }
    
    // 更新单位
    function updateUnits() {
        // 更新玩家单位
        gameState.units.forEach(unit => {
            // 如果单位有目标位置，则移动
            if (unit.targetX !== null && unit.targetY !== null) {
                // 确保不会太频繁移动
                if (gameState.gameTick - unit.lastMoved >= Math.floor(5 / unit.speed)) {
                    // 计算方向
                    const dx = unit.targetX - unit.x;
                    const dy = unit.targetY - unit.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0.1) {
                        // 移动单位
                        const speedFactor = 0.5;
                        unit.x += (dx / distance) * speedFactor * unit.speed;
                        unit.y += (dy / distance) * speedFactor * unit.speed;
                        
                        // 更新单位元素位置
                        const posX = unit.x * gameState.map.tileSize + gameState.map.offsetX;
                        const posY = unit.y * gameState.map.tileSize + gameState.map.offsetY;
                        unit.element.style.left = posX + 15 + 'px';
                        unit.element.style.top = posY + 15 + 'px';
                        
                        // 更新数据属性
                        unit.element.dataset.x = unit.x;
                        unit.element.dataset.y = unit.y;
                        
                        unit.lastMoved = gameState.gameTick;
                    } else {
                        // 到达目标位置
                        unit.targetX = null;
                        unit.targetY = null;
                        
                        // 四舍五入到最近的格子
                        unit.x = Math.round(unit.x);
                        unit.y = Math.round(unit.y);
                        
                        // 更新单位元素位置
                        const posX = unit.x * gameState.map.tileSize + gameState.map.offsetX;
                        const posY = unit.y * gameState.map.tileSize + gameState.map.offsetY;
                        unit.element.style.left = posX + 15 + 'px';
                        unit.element.style.top = posY + 15 + 'px';
                        
                        // 更新数据属性
                        unit.element.dataset.x = unit.x;
                        unit.element.dataset.y = unit.y;
                    }
                }
            }
            
            // 攻击范围内的敌人
            const nearbyEnemies = gameState.enemies.filter(enemy => {
                const dx = enemy.x - unit.x;
                const dy = enemy.y - unit.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= unit.range;
            });
            
            if (nearbyEnemies.length > 0) {
                // 攻击最近的敌人
                nearbyEnemies.sort((a, b) => {
                    const distA = Math.sqrt(Math.pow(a.x - unit.x, 2) + Math.pow(a.y - unit.y, 2));
                    const distB = Math.sqrt(Math.pow(b.x - unit.x, 2) + Math.pow(b.y - unit.y, 2));
                    return distA - distB;
                });
                
                const target = nearbyEnemies[0];
                
                // 每10个tick攻击一次
                if (gameState.gameTick % 10 === 0) {
                    target.health -= unit.attack;
                    
                    // 如果敌人死亡，移除它
                    if (target.health <= 0) {
                        removeEntity(target);
                    }
                }
            }
        });
        
        // 更新敌人单位
        gameState.enemies.forEach(enemy => {
            // 简单AI：朝最近的玩家建筑或单位移动
            if (gameState.gameTick % 20 === 0 && gameState.activeAI) {
                const targets = [...gameState.buildings.filter(b => b.isPlayer), ...gameState.units];
                
                if (targets.length > 0) {
                    // 找出最近的目标
                    let nearestTarget = null;
                    let nearestDistance = Infinity;
                    
                    targets.forEach(target => {
                        const dx = target.x - enemy.x;
                        const dy = target.y - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < nearestDistance) {
                            nearestDistance = distance;
                            nearestTarget = target;
                        }
                    });
                    
                    if (nearestTarget) {
                        enemy.targetX = nearestTarget.x;
                        enemy.targetY = nearestTarget.y;
                    }
                }
            }
            
            // 移动敌人
            if (enemy.targetX !== null && enemy.targetY !== null) {
                if (gameState.gameTick - enemy.lastMoved >= Math.floor(5 / enemy.speed)) {
                    // 计算方向
                    const dx = enemy.targetX - enemy.x;
                    const dy = enemy.targetY - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0.1) {
                        // 移动敌人
                        const speedFactor = 0.5;
                        enemy.x += (dx / distance) * speedFactor * enemy.speed;
                        enemy.y += (dy / distance) * speedFactor * enemy.speed;
                        
                        // 更新敌人元素位置
                        const posX = enemy.x * gameState.map.tileSize + gameState.map.offsetX;
                        const posY = enemy.y * gameState.map.tileSize + gameState.map.offsetY;
                        enemy.element.style.left = posX + 15 + 'px';
                        enemy.element.style.top = posY + 15 + 'px';
                        
                        // 更新数据属性
                        enemy.element.dataset.x = enemy.x;
                        enemy.element.dataset.y = enemy.y;
                        
                        enemy.lastMoved = gameState.gameTick;
                    } else {
                        // 到达目标位置
                        enemy.targetX = null;
                        enemy.targetY = null;
                    }
                }
            }
            
            // 攻击范围内的玩家单位或建筑
            const nearbyTargets = [...gameState.units, ...gameState.buildings.filter(b => b.isPlayer)].filter(target => {
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= enemy.range;
            });
            
            if (nearbyTargets.length > 0) {
                // 攻击最近的目标
                nearbyTargets.sort((a, b) => {
                    const distA = Math.sqrt(Math.pow(a.x - enemy.x, 2) + Math.pow(a.y - enemy.y, 2));
                    const distB = Math.sqrt(Math.pow(b.x - enemy.x, 2) + Math.pow(b.y - enemy.y, 2));
                    return distA - distB;
                });
                
                const target = nearbyTargets[0];
                
                // 每10个tick攻击一次
                if (gameState.gameTick % 10 === 0) {
                    target.health -= enemy.attack;
                    
                    // 如果目标死亡，移除它
                    if (target.health <= 0) {
                        removeEntity(target);
                    }
                }
            }
        });
    }
    
    // 更新建筑
    function updateBuildings() {
        // 目前没有太多建筑更新逻辑
    }
    
    // 生成敌人
    function spawnEnemy() {
        // 找到敌人建筑（兵营或城堡）
        const enemyBuildings = gameState.buildings.filter(b => !b.isPlayer && (b.buildingType === 'barracks' || b.buildingType === 'castle'));
        
        if (enemyBuildings.length > 0) {
            // 随机选择一个建筑
            const randomBuilding = enemyBuildings[Math.floor(Math.random() * enemyBuildings.length)];
            
            // 随机选择单位类型
            const unitTypes = ['warrior', 'archer', 'cavalry'];
            const randomUnitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
            
            // 在建筑周围找一个位置
            const positions = [
                { x: randomBuilding.x+1, y: randomBuilding.y },
                { x: randomBuilding.x-1, y: randomBuilding.y },
                { x: randomBuilding.x, y: randomBuilding.y+1 },
                { x: randomBuilding.x, y: randomBuilding.y-1 }
            ];
            
            for (const pos of positions) {
                if (pos.x >= 0 && pos.x < gameState.map.width && 
                    pos.y >= 0 && pos.y < gameState.map.height) {
                    
                    if (!getEntityAtPosition(pos.x, pos.y)) {
                        createUnit(randomUnitType, pos.x, pos.y, false);
                        break;
                    }
                }
            }
        }
    }
    
    // 移除实体
    function removeEntity(entity) {
        if (entity.type === 'unit') {
            // 从DOM中移除
            entity.element.remove();
            
            // 从游戏状态中移除
            if (entity.isPlayer) {
                gameState.units = gameState.units.filter(u => u !== entity);
                gameState.resources.population--;
            } else {
                gameState.enemies = gameState.enemies.filter(e => e !== entity);
            }
        } else if (entity.type === 'building') {
            // 从DOM中移除
            entity.element.remove();
            
            // 从游戏状态中移除
            gameState.buildings = gameState.buildings.filter(b => b !== entity);
            
            // 如果是城堡，可能影响游戏结束
            if (entity.buildingType === 'castle') {
                if (entity.isPlayer) {
                    endGame(false); // 玩家失败
                } else {
                    endGame(true); // 玩家胜利
                }
            }
        }
        
        // 如果移除的是当前选中的实体，清除选择
        if (gameState.selectedEntity === entity) {
            clearSelection();
        }
        
        // 更新小地图
        updateMinimap();
    }
    
    // 检查游戏结束条件
    function checkGameEnd() {
        // 检查玩家是否还有城堡
        const playerCastle = gameState.buildings.find(b => b.isPlayer && b.buildingType === 'castle');
        if (!playerCastle) {
            endGame(false); // 玩家失败
            return;
        }
        
        // 检查敌人是否还有城堡
        const enemyCastle = gameState.buildings.find(b => !b.isPlayer && b.buildingType === 'castle');
        if (!enemyCastle) {
            endGame(true); // 玩家胜利
            return;
        }
    }
    
    // 游戏结束
    function endGame(playerWon) {
        gameState.gameStarted = false;
        gameState.activeAI = false;
        
        if (playerWon) {
            showMessage("Victory! You have defeated the enemy!");
        } else {
            showMessage("Defeat! Your empire has fallen!");
        }
        
        // 显示重新开始按钮
        setTimeout(() => {
            loadingScreen.style.display = 'flex';
            loadingScreen.querySelector('h2').textContent = playerWon ? "Victory!" : "Defeat!";
            startButton.textContent = "Play Again";
            startButton.style.display = 'block';
            loadingProgress.style.display = 'none';
        }, 2000);
    }
    
    // 模拟加载进度
    function simulateLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            loadingProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    startButton.style.display = 'block';
                }, 500);
            }
        }, 100);
    }
    
    // 开始加载游戏
    simulateLoading();
    
    // 初始化游戏
    initializeGame();
}); 