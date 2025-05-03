# 更新版权年份的PowerShell脚本
# 将"&copy; 2023 GameHaven"替换为"&copy; 2025 GameHaven"

# 获取所有HTML、CSS和JS文件
$files = Get-ChildItem -Recurse -Include *.html,*.css,*.js

# 遍历每个文件
foreach ($file in $files) {
    # 读取文件内容
    $content = Get-Content $file.FullName -Raw
    
    # 检查文件是否包含目标字符串
    if ($content -match "(&copy;|©) 2023 GameHaven") {
        # 替换内容
        $newContent = $content -replace "(&copy;|©) 2023 GameHaven", "`$1 2025 GameHaven"
        
        # 写入修改后的内容
        Set-Content -Path $file.FullName -Value $newContent
        
        # 输出已更新的文件
        Write-Host "已更新文件: $($file.FullName)"
    }
}

Write-Host "所有文件已更新完成！" 