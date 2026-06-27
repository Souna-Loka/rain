const botData = {
    "home": {
        "title": "丝绪子nd",
        "subtitle": "你好,的说...",
        "description": "能支持舞萌查分,还有各类小游戏的普通bot"
    },
    "about": {
        "content": "这是一个Bot。如有 bug 请联系开发者。"
    },
    "commands": [
        {
            "category": "maimai",
            "name": "b50/b40",
            "desc": "查询 B50 和 B40 成绩图",
            "params": "水鱼名/@群友(可选)",
            "examples": [
                "b50/b40",
                "b50 @user",
                "b50 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "ap50/fc50(+)",
            "desc": "查询 AP50 和 FC50 成绩图",
            "params": "all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "ap50/ap+50/fc50/fc+50",
                "fc+50 @user",
                "ap+50 水鱼名 all"
            ]
        },
        {
            "category": "maimai",
            "name": "ab50",
            "desc": "不分版本查询 B50 成绩图",
            "params": "水鱼名/@群友(可选)",
            "examples": [
                "ab50",
                "ab50 @user",
                "ab50 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "f50",
            "desc": "按照拟合定数进行计算的 B50 成绩图,可以称作拟合50",
            "params": "all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "f50",
                "f50 @user",
                "f50 水鱼名 all"
            ]
        },
        {
            "category": "maimai",
            "name": "lx50",
            "desc": "把所有成绩的评分都提升一档的 B50 成绩图,可以称作理想50",
            "params": "all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "lx50",
                "lx50 @user",
                "lx50 水鱼名 all"
            ]
        },
        {
            "category": "maimai",
            "name": "sj50",
            "desc": "随机选出50首成绩图,可以称作随机50",
            "params": "水鱼名/@群友(可选)",
            "examples": [
                "sj50",
                "sj50 @user",
                "sj50 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "h50",
            "desc": "筛选出高于设定值的50首成绩,默认设定值为100.5",
            "params": "设定分数(可选),all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "h50",
                "h50 100.8 @user",
                "h50 99.5 all 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "l50",
            "desc": "筛选出低于设定值的50首成绩,默认设定值为100",
            "params": "设定分数(可选),all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "l50",
                "l50 100 @user",
                "l50 90.55 all 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "c50",
            "desc": "分数介于99.95-99.9999,100.45-100.4999之间的50首成绩图,可以称作寸50",
            "params": "水鱼名/@群友(可选)",
            "examples": [
                "c50",
                "c50 @user",
                "c50 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "nb50",
            "desc": "分数介于100-100.0050,100.5-100.505之间的50首成绩图,可以称作名刀50",
            "params": "水鱼名/@群友(可选)",
            "examples": [
                "nb50",
                "nb50 @user",
                "nb50 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "1/2/3/4/5x50",
            "desc": "筛选dx评分超过指定星数的,ra最高的前50首成绩图。数字代表dx评分星星的数量",
            "params": "all(不分版本进行查询,可选),only(可选,只展示对应星数的成绩),水鱼名/@群友(可选)",
            "examples": [
                "1x50/2x50/3x50/4x50/5x50",
                "1x50 only @user",
                "2x50 all 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "绿/黄/红/紫/白谱50",
            "desc": "筛选出对应难度的,ra最高的前50首成绩图。颜色代表谱面难度",
            "params": "all(不分版本进行查询,可选),水鱼名/@群友(可选)",
            "examples": [
                "绿50/红50/黄50/紫50/白50",
                "绿50 @user",
                "绿50 all 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "info",
            "desc": "查询指定曲目的成绩",
            "params": "曲目id/曲目别名/曲目名称(三选一),水鱼名/@群友(可选)",
            "examples": [
                "info id666",
                "info don't fight the music @user",
                "info 彩虹猫 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "ginfo",
            "desc": "查询指定曲目的游玩总览,默认为紫谱",
            "params": "谱面难度(可选,默认为紫),曲目id/曲目别名/曲目名称(三选一)",
            "examples": [
                "ginfo",
                "ginfo luminaria",
                "ginfo 白偶像"
            ]
        },
        {
            "category": "maimai",
            "name": "等级进度",
            "desc": "查询对应等级所选评价的完成进度",
            "params": "等级(必填),评价(必填,可填参数有SSS,AAA或FC等),进度(可选,已完成/未完成/未游玩三选一),水鱼名/@群友(可选),页码(可选,在填写进度的情况下需要填写)",
            "examples": [
                "13 SSS 进度",
                "14+ fc 未完成 进度 @user",
                "12 未游玩 进度 水鱼名 2"
            ]
        },
        {
            "category": "maimai",
            "name": "牌子进度/版本进度",
            "desc": "查询对应版本所选评价的完成进度",
            "params": "难度(可选),版本(必填),评价(极/将/神/舞舞或SSS,FC等),进度(可选,已完成/未完成/未游玩三选一),水鱼名/@群友(可选),页码(可选)",
            "examples": [
                "堇将进度",
                "红镜将 未游玩 进度 水鱼名",
                "真SSS 已完成 进度 @user 2"
            ]
        },
        {
            "category": "maimai",
            "name": "流派进度",
            "desc": "查询对应流派所选评价的完成进度",
            "params": "难度(可选),流派(必填,可填参数有东方/舞萌/音击中二/流行动漫/术力口/其他游戏/烤),评价(极/将/神/舞舞或SSS,FC等),进度(可选,已完成/未完成/未游玩三选一),水鱼名/@群友(可选),页码(可选)",
            "examples": [
                "东方将进度",
                "术力口极 进度 水鱼名",
                "紫舞萌神 未完成 进度 @user 2"
            ]
        },
        {
            "category": "maimai",
            "name": "等级分数列表",
            "desc": "查询对应等级的分数列表",
            "params": "等级(必填,可填小数后一位),页码(可选),水鱼名/@群友(可选)",
            "examples": [
                "14分数列表",
                "13+分数列表2 @user",
                "12.8分数列表 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "ap/fc(+)分数列表",
            "desc": "查询符合条件的成绩的分数列表",
            "params": "评价(必填,可填参数有ap或FC等),页码(可选),水鱼名/@群友(可选)",
            "examples": [
                "ap列表",
                "fc+列表 @user",
                "ap+列表2 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "fs/fdx(+)分数列表",
            "desc": "查询符合条件的成绩的分数列表",
            "params": "评价(必填,可填参数有SSS,AAA或FC等),页码(可选),水鱼名/@群友(可选)",
            "examples": [
                "fs列表",
                "fdx+列表 @user",
                "fs+列表2 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "dx星分数列表",
            "desc": "查询符合条件的成绩的分数列表",
            "params": "dx分(必填,可填参数有1-5星),only(可选,只展示对应星数的成绩),页码(可选),水鱼名/@群友(可选)",
            "examples": [
                "3x列表",
                "二星列表 @user",
                "3x列表 only 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "对应分数区间分数列表",
            "desc": "查询符合条件的成绩的分数列表",
            "params": "分数区间(必填)页码(可选),水鱼名/@群友(可选)",
            "examples": [
                "100.5 100.5列表",
                "99.5 100.5列表 @user",
                "5.5 55.5列表 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "等级完成表",
            "desc": "查看指定等级的完成表",
            "params": "等级(必填),评价(可填参数有SSS+,AAA或FC等,默认为SSS),水鱼名/@群友(可选)",
            "examples": [
                "13完成表",
                "15SSS+完成表 @user",
                "14+FC完成表 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "牌子完成表/版本完成表",
            "desc": "查看指定版本的完成表",
            "params": "版本(必填),评价(可选参数有极/将/神/舞舞),水鱼名/@群友(可选)",
            "examples": [
                "白将完成表",
                "辉神完成表 @user",
                "晓极完成表 水鱼名"
            ]
        },
        {
            "category": "maimai",
            "name": "定数表",
            "desc": "查询指定成绩的定数表",
            "params": "等级(必填)",
            "examples": [
                "11定数表"
            ]
        },
        {
            "category": "maimai",
            "name": "今日舞萌",
            "desc": "查询今日舞萌运势",
            "params": "无",
            "examples": [
                "今日舞萌",
                "今日mai"
            ]
        },
        {
            "category": "maimai",
            "name": "随个",
            "desc": "随机发送一个符合要求的谱面",
            "params": "类型(可选,可填dx或标准),谱面难度(可选),等级(必填)",
            "examples": [
                "随个12",
                "随个白13+",
                "随个标准紫14"
            ]
        },
        {
            "category": "maimai",
            "name": "mai什么",
            "desc": "随机发送一个谱面",
            "params": "无)",
            "examples": [
                "mai什么"
            ]
        },
        {
            "category": "maimai",
            "name": "查歌",
            "desc": "查询曲名含该文字的曲目",
            "params": "曲目关键词(必填)",
            "examples": [
                "查歌 人"
            ]
        },
        {
            "category": "maimai",
            "name": "是什么歌",
            "desc": "查询该别名的曲目",
            "params": "曲目id/曲目别名/曲目名称(三选一)",
            "examples": [
                "618是什么歌",
                "一罚是什么歌",
                "doll judgment是什么歌"
            ]
        },
        {
            "category": "maimai",
            "name": "有什么别名",
            "desc": "查询曲名含该曲目的所有别名",
            "params": "曲目id/曲目别名/曲目名称(三选一)",
            "examples": [
                "592有什么别名",
                "华集落有什么别名",
                "Emperror有什么别名"
            ]
        },
        {
            "category": "maimai",
            "name": "添加别名",
            "desc": "添加曲目的别名",
            "params": "曲目id",
            "examples": [
                "添加别名 11746 黑人打架2"
            ]
        },
        {
            "category": "maimai",
            "name": "定数查歌",
            "desc": "使用定数查歌或定数的上限或下限查询",
            "params": "谱面定数(必填),页码(可选)/谱面定数上限(必填)-谱面定数下限(必填),页码(可选)",
            "examples": [
                "定数查歌 12.5",
                "定数查歌 13.1 13.4"
            ]
        },
        {
            "category": "maimai",
            "name": "bpm查歌",
            "desc": "使bpm查歌或bpm的上限或下限查询",
            "params": "bpm(必填),页码(可选)/bpm上限(必填)-bpm下限(必填),页码(可选)",
            "examples": [
                "bpm查歌 180",
                "bpm查歌 60 80"
            ]
        },
        {
            "category": "maimai",
            "name": "曲师查歌",
            "desc": "查询指定曲师的所有曲目",
            "params": "曲师名(必填),页码(可选)",
            "examples": [
                "曲师查歌 豚乙女"
            ]
        },
        {
            "category": "maimai",
            "name": "谱师查歌",
            "desc": "查询指定谱师的所有曲目",
            "params": "谱师名(必填),页码(可选)",
            "examples": [
                "谱师查歌 譜面-100号"
            ]
        },
        {
            "category": "maimai",
            "name": "id查歌",
            "desc": "查询乐曲信息或谱面信息",
            "params": "谱面id(必填)",
            "examples": [
                "id834"
            ]
        },
        {
            "category": "maimai",
            "name": "分数线",
            "desc": "查询分数线,详细请发送“分数线 帮助”",
            "params": "谱面难度(选填,默认为紫),谱面id(必填),分数线(选填)",
            "examples": [
                "分数线 id799 100"
            ]
        },
        {
            "category": "maimai",
            "name": "排名",
            "desc": "查询你的qq号在水鱼查分器上的排名”",
            "params": "无",
            "examples": [
                "排名"
            ]
        },
        {
            "category": "fun",
            "name": "猜歌/猜曲绘",
            "desc": "开始一轮猜歌游戏",
            "params": "无",
            "examples": [
                "猜歌",
                "猜曲绘"
            ]
        },
        {
            "category": "fun",
            "name": "早安",
            "desc": "和丝绪子nd打招呼",
            "params": "无",
            "examples": [
                "早安"
            ]
        },
        {
            "category": "fun",
            "name": "戳一戳",
            "desc": "bot会试图吃掉你的绝赞",
            "params": "无",
            "examples": [
                "直接双击bot的qq头像即可"
            ]
        },
        {
            "category": "fun",
            "name": "出勤吗",
            "desc": "bot会返回抽象舞萌小文案",
            "params": "无",
            "examples": [
                "出勤吗"
            ]
        },
        {
            "category": "fun",
            "name": "(",
            "desc": "只留了一半的括号是多么令人苦恼...",
            "params": "无",
            "examples": [
                "("
            ]
        },
        {
            "category": "fun",
            "name": "赞我",
            "desc": "bot会给你点十个赞的说",
            "params": "无",
            "examples": [
                "赞我"
            ]
        },
        {
            "category": "fun",
            "name": "roll",
            "desc": "bot会帮你做出选择",
            "params": "两个及以上的选项",
            "examples": [
                "roll 出勤 睡觉 吃饭"
            ]
        },
        {
            "category": "fun",
            "name": "帮助",
            "desc": "锵锵,帮助菜单出现了",
            "params": "无",
            "examples": [
                "help"
            ]
        },
        {
            "category": "fun",
            "name": "抢劫",
            "desc": "积分虽然没有什么用,但是抢来抢去很好玩",
            "params": "无",
            "examples": [
                "抢劫@群友"
            ]
        },
        {
            "category": "fun",
            "name": "重置冷却",
            "desc": "消耗25积分,重置抢劫的冷却时间",
            "params": "无",
            "examples": [
                "重置冷却"
            ]
        },
        {
            "category": "fun",
            "name": "查积分",
            "desc": "来看看自己有多少积分吧",
            "params": "无",
            "examples": [
                "查积分"
            ]
        },
        {
            "category": "fun",
            "name": "看bot积分",
            "desc": "她总是从各个地方拿走积分",
            "params": "无",
            "examples": [
                "你有多少积分@丝绪子nd"
            ]
        },
        {
            "category": "fun",
            "name": "转让积分",
            "desc": "慷慨的分享使人快乐",
            "params": "接收积分的群友(必填),转让积分的数量",
            "examples": [
                "转让积分 @群友 50"
            ]
        },
        {
            "category": "fun",
            "name": "随机小猪",
            "params": "无",
            "desc": "来随机抽取一张小猪图片吧",
            "examples": [
                "随机小猪"
            ]
        },
        {
            "category": "fun",
            "name": "今日小猪",
            "params": "无",
            "desc": "来看看你的今日代表猪猪",
            "examples": [
                "今日小猪"
            ]
        },
        {
            "category": "maimai",
            "name": "底力分析",
            "params": "无",
            "desc": "分析你的 Best100 成绩构成,生成三维度雷达图+柱状图报告",
            "examples": [
                "底力分析"
            ]
        },
        {
            "category": "maimai",
            "name": "rating趋势图",
            "params": "无",
            "desc": "自动记录每次查询 B50 时的 Rating,绘制阶梯式底分趋势图",
            "examples": [
                "趋势",
                "qs",
                "(上面那个英文缩写后面有个空格)"
            ]
        },
        {
            "category": "maimai",
            "name": "增加rating趋势图的日期点",
            "params": "日期(必填),rating(必填)",
            "desc": "增加日期点",
            "examples": [
                "增加趋势 25.6.3 12345",
                "ad 25.6.3 12345"
            ]
        },
        {
            "category": "maimai",
            "name": "删除rating趋势图日期点",
            "params": "日期(必填)",
            "desc": "删除日期点",
            "examples": [
                "删除趋势 25.6.3",
                "del 25.6.3"
            ]
        },
        {
            "category": "fun",
            "name": "抽签",
            "params": "无",
            "desc": "总之就是抽签啦",
            "examples": [
                "抽签"
            ]
        },
        {
            "category": "fishing",
            "name": "捕鱼",
            "desc": "在鱼出现时进行捕鱼",
            "params": "无",
            "examples": [
                "捕鱼"
            ]
        },
        {
            "category": "fishing",
            "name": "面板",
            "desc": "查看自己的角色面板",
            "params": "无",
            "examples": [
                "面板"
            ]
        },
        {
            "category": "fishing",
            "name": "背包",
            "desc": "查看自己的背包列表",
            "params": "[页数]",
            "examples": [
                "背包",
                "背包 2"
            ]
        },
        {
            "category": "fishing",
            "name": "使用",
            "desc": "使用道具",
            "params": "<道具编号> [其他参数]",
            "examples": [
                "使用 1",
                "使用 1 参数"
            ]
        },
        {
            "category": "fishing",
            "name": "单抽/十连/百连",
            "desc": "使用金币进行抽奖（单抽10金币，十连100金币，百连1000金币）",
            "params": "无",
            "examples": [
                "单抽",
                "十连",
                "百连"
            ]
        },
        {
            "category": "fishing",
            "name": "神秘单抽/神秘十连/神秘百连",
            "desc": "使用金币进行神秘抽奖（100/1000/10000 金币）",
            "params": "无",
            "examples": [
                "神秘单抽",
                "神秘十连",
                "神秘百连"
            ]
        },
        {
            "category": "fishing",
            "name": "状态",
            "desc": "查看池子状态",
            "params": "无",
            "examples": [
                "状态"
            ]
        },
        {
            "category": "fishing",
            "name": "商店",
            "desc": "查看商店",
            "params": "无",
            "examples": [
                "商店"
            ]
        },
        {
            "category": "fishing",
            "name": "商店购买",
            "desc": "购买商品",
            "params": "<商品编号>",
            "examples": [
                "商店购买 1"
            ]
        },
        {
            "category": "fishing",
            "name": "合成",
            "desc": "查看合成工坊或合成指定道具",
            "params": "[道具编号] [数量]",
            "examples": [
                "合成",
                "合成 1",
                "合成 1 5"
            ]
        },
        {
            "category": "fishing",
            "name": "赠送",
            "desc": "赠送道具给其他玩家（24小时冷却，仅限部分道具）",
            "params": "<QQ号> <道具编号>",
            "examples": [
                "赠送 123456789 1"
            ]
        },
        {
            "category": "fishing",
            "name": "建筑",
            "desc": "显示建筑面板",
            "params": "无",
            "examples": [
                "建筑"
            ]
        },
        {
            "category": "fishing",
            "name": "大锅",
            "desc": "显示大锅面板",
            "params": "无",
            "examples": [
                "大锅"
            ]
        },
        {
            "category": "fishing",
            "name": "绑定qq",
            "desc": "可以绑定捕鱼游戏",
            "params": "无",
            "examples": [
                "绑定qq"
            ]
        }
    ]
};