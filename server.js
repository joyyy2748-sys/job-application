const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// 配置
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456'; // 建议修改

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // 托管静态文件

// 自定义基础认证中间件（只用于 /admin 路径）
function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('需要登录');
    }
    const base64 = authHeader.split(' ')[1];
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return next();
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('用户名或密码错误');
}

// 前台提交接口（无认证）
app.post('/api/submit', (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date().toLocaleString('zh-CN');
        
        let content = `========================================\n`;
        content += `提交时间: ${timestamp}\n`;
        content += `----------------------------------------\n`;
        content += `【基本信息】\n`;
        content += `所属大区/城市: ${data.region || '未填'}\n`;
        content += `门店/部门: ${data.department || '未填'}\n`;
        content += `姓名: ${data.name || '未填'}\n`;
        content += `性别: ${data.gender || '未填'}\n`;
        content += `出生年月: ${data.birthDate || '未填'}\n`;
        content += `学历: ${data.education || '未填'}\n`;
        content += `民族: ${data.ethnicity || '未填'}\n`;
        content += `身份证号: ${data.idCard || '未填'}\n`;
        content += `政治面貌: ${data.politicalStatus || '未填'}\n`;
        content += `血型: ${data.bloodType || '未填'}\n`;
        content += `健康状况: ${data.health || '未填'}\n`;
        content += `联系电话: ${data.phone || '未填'}\n`;
        content += `最快到岗时间: ${data.availableDate || '未填'}\n`;
        content += `婚育状况: ${data.maritalStatus || '未填'}\n`;
        content += `子女男: ${data.childrenMale || 0}人, 子女女: ${data.childrenFemale || 0}人\n`;
        content += `户籍地址: ${data.hukouAddress || '未填'}\n`;
        content += `现住址: ${data.currentAddress || '未填'}\n`;
        content += `应聘岗位: ${data.position || '未填'}\n`;
        content += `薪资要求: ${data.salaryExpectation || '未填'}\n`;
        content += `与原单位关系: ${data.relationStatus || '未填'}\n`;
        content += `紧急联络人: ${data.emergencyContact || '未填'}\n`;
        content += `紧急联络人电话: ${data.emergencyPhone || '未填'}\n`;
        content += `信息来源: ${data.source ? (Array.isArray(data.source) ? data.source.join(',') : data.source) : '未填'}\n`;
        content += `介绍人姓名: ${data.referrerName || '未填'}\n`;
        content += `介绍人电话: ${data.referrerPhone || '未填'}\n`;
        content += `与介绍人关系: ${data.referrerRelation || '未填'}\n`;

        // 教育经历（数组）
        if (data.edu_time && data.edu_time.length) {
            content += `\n【教育经历】\n`;
            for (let i = 0; i < data.edu_time.length; i++) {
                if (data.edu_time[i]) {
                    content += `  - 时间: ${data.edu_time[i]} | 学校: ${data.edu_school[i] || ''} | 入读途径: ${data.edu_type[i] || ''} | 专业: ${data.edu_major[i] || ''} | 证书/职称: ${data.edu_cert[i] || ''}\n`;
                }
            }
        }

        // 工作经历（数组）
        if (data.work_time && data.work_time.length) {
            content += `\n【工作经历】\n`;
            for (let i = 0; i < data.work_time.length; i++) {
                if (data.work_time[i]) {
                    content += `  - 时间: ${data.work_time[i]} | 公司: ${data.work_company[i] || ''} | 职位: ${data.work_position[i] || ''} | 薪资待遇: ${data.work_salary[i] || ''} | 离职原因: ${data.work_reason[i] || ''} | 证明人: ${data.work_ref[i] || ''} | 联系电话: ${data.work_phone[i] || ''}\n`;
                }
            }
        }

        // 家庭情况（可选，但为了完整也保存）
        if (data.fam_name && data.fam_name.length) {
            content += `\n【家庭情况】\n`;
            for (let i = 0; i < data.fam_name.length; i++) {
                if (data.fam_name[i]) {
                    content += `  - 姓名: ${data.fam_name[i]} | 年龄: ${data.fam_age[i] || ''} | 关系: ${data.fam_relation[i] || ''} | 工作单位: ${data.fam_company[i] || ''} | 电话: ${data.fam_phone[i] || ''}\n`;
                }
            }
        }

        // 背景调查
        content += `\n【背景调查】\n`;
        content += `  是否同意接触前雇主: ${data.backgroundCheck || '未填'}\n`;

        // 测试题
        content += `\n【面试测试题答案】\n`;
        for (let i = 1; i <= 7; i++) {
            content += `  第${i}题: ${data['q' + i] || '未答'}\n`;
        }

        // 自我评价表格（8项）
        content += `\n【自我评价】\n`;
        content += `  工作状态: ${data.self_workState || '-'}, 协同意愿: ${data.self_collab || '-'}, 学习意愿: ${data.self_learn || '-'}, 晋升意愿: ${data.self_promote || '-'}, 执行力: ${data.self_exec || '-'}, 沟通能力: ${data.self_comm || '-'}, 业务能力: ${data.self_biz || '-'}, 管理能力: ${data.self_mgmt || '-'}\n`;

        // 签字
        content += `\n【签字】\n`;
        content += `  应聘者签字: ${data.signature || '未填'}\n`;
        content += `  日期: ${data.signDate || '未填'}\n`;
        content += `----------------------------------------\n\n`;

        fs.appendFileSync(path.join(__dirname, 'applicants_data.txt'), content, 'utf8');
        console.log(`✅ 收到新应聘: ${data.name}`);
        res.json({ success: true, message: '提交成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 后台接口（需要认证）
app.get('/admin', basicAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// 获取解析后的数据（需要认证）
app.get('/admin/api/data', basicAuth, (req, res) => {
    try {
        const filePath = path.join(__dirname, 'applicants_data.txt');
        if (!fs.existsSync(filePath)) {
            return res.json({ success: true, data: [], total: 0 });
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const rawRecords = content.split('========================================\n').filter(r => r.trim());
        const records = rawRecords.map(block => {
            const lines = block.split('\n').filter(l => l.trim());
            const record = {
                submitTime: '',
                basicInfo: {},
                education: [],
                workExp: [],
                family: [],
                testAnswers: {},
                selfEval: {}
            };
            let section = '';
            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('提交时间:')) {
                    record.submitTime = line.replace('提交时间:', '').trim();
                } else if (line.includes('【基本信息】')) {
                    section = 'basic';
                } else if (line.includes('【教育经历】')) {
                    section = 'edu';
                } else if (line.includes('【工作经历】')) {
                    section = 'work';
                } else if (line.includes('【家庭情况】')) {
                    section = 'family';
                } else if (line.includes('【面试测试题答案】')) {
                    section = 'test';
                } else if (line.includes('【自我评价】')) {
                    section = 'self';
                } else if (line.startsWith('----------------------------------------')) {
                    // ignore
                } else {
                    if (section === 'basic' && line.includes(':')) {
                        const [key, val] = line.split(':').map(s => s.trim());
                        record.basicInfo[key] = val;
                    } else if (section === 'edu' && line.startsWith('-')) {
                        // 格式: - 时间: xxx | 学校: xxx | ...
                        const parts = line.substring(2).split('|').map(p => p.trim());
                        const edu = {};
                        parts.forEach(p => {
                            const [k, v] = p.split(':').map(s => s.trim());
                            edu[k] = v;
                        });
                        record.education.push(edu);
                    } else if (section === 'work' && line.startsWith('-')) {
                        const parts = line.substring(2).split('|').map(p => p.trim());
                        const work = {};
                        parts.forEach(p => {
                            const [k, v] = p.split(':').map(s => s.trim());
                            work[k] = v;
                        });
                        record.workExp.push(work);
                    } else if (section === 'family' && line.startsWith('-')) {
                        const parts = line.substring(2).split('|').map(p => p.trim());
                        const fam = {};
                        parts.forEach(p => {
                            const [k, v] = p.split(':').map(s => s.trim());
                            fam[k] = v;
                        });
                        record.family.push(fam);
                    } else if (section === 'test' && line.startsWith('第')) {
                        const match = line.match(/第(\d+)题:\s*(.+)/);
                        if (match) {
                            record.testAnswers[`q${match[1]}`] = match[2].trim();
                        }
                    } else if (section === 'self') {
                        // 自我评价行: 工作状态: xxx, 协同意愿: xxx, ...
                        const items = line.split(',').map(i => i.trim());
                        items.forEach(item => {
                            const [k, v] = item.split(':').map(s => s.trim());
                            if (k && v) record.selfEval[k] = v;
                        });
                    }
                }
            });
            return record;
        });

        res.json({ success: true, data: records, total: records.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 原始文本接口（需要认证）
app.get('/admin/api/raw', basicAuth, (req, res) => {
    const filePath = path.join(__dirname, 'applicants_data.txt');
    if (!fs.existsSync(filePath)) return res.send('暂无数据');
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📄 管理后台 http://localhost:${PORT}/admin`);
});