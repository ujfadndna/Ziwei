# 1小时Demo规格（Ren'Py）
## 目标体验
玩家扮演男主，只能通过“手机App”看到女主的 HR(心率) 与 Mood(心情) 两条信号；盲区里发生的真实原因不可见。玩家选择会在“守护/控制/放任”之间累积，最终进入3个Demo结局。

## 可见变量（玩家看得到）
- HR: 40-160
- Mood: -100..+100

## 内部变量（默认隐藏；Debug模式可显示）
- Trust: 0..100
- Intimacy: 0..100
- Autonomy: 0..100
- Pressure: 0..100
- RivalLink: 0..100
- ControlDebt: 0..100
- WifeState: enum {Calm, Strained, Defensive, SeekingSupport, Numb, Crisis}
- WorkRisk: 0..100（Demo中只做提示，不做失败结局）

## 每日结构（共5天，每天3段）
- Morning（可控区）：沟通/分担/安排支持系统
- Noon（盲区）：只看数据做远程选择（打电话/找第三方/赶回去/不处理）
- Night（结算区）：对话与复盘，更新状态与变量

## 事件系统
- 事件池按 time_slot + scene + WifeState + 若干阈值挑选
- 每段至少1个事件；关键节点采用 knot-and-variants（同一节点多版本）

## 手机App UI（必须实现）
- 右上角“手机”按钮展开 App 面板
- 显示 HR/Mood 当前值 + 简易趋势（↑↓→）
- 显示“状态标签”（不可靠）：例如 紧张/疲惫/平静/兴奋（允许误判）
- 统计“今日查看次数”，查看次数影响 ControlDebt

## 结局（第5天夜晚判定）
- 结局A【守住】：Support行为多（用计算代替Support变量：如分担/倾听/求助）且 ControlDebt不高、Trust较高
- 结局B【隐形堕落】：ControlDebt高且 Trust低（以爱之名监控/控制）
- 结局C【悬置】：RivalLink或Pressure偏高但尚未崩盘

## 内容限制
不写露骨内容；越界/压力通过对话、暗示、后果呈现。

## 验收标准
- 可从 start 运行到3个结局之一
- App UI可用，查看次数与变量有影响
- 有Debug开关显示内部变量
