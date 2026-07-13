# Stable Diffusion Prompt Notes

Last verified: 2026-07-10

只在用户指定 Stable Diffusion、SD、AUTOMATIC1111 或 ComfyUI 时读取。输出应服从用户实际 checkpoint 与工作流，不把 Midjourney 参数或自然语言平台假想能力混入其中。

## 写法

- 正向 Prompt 按当前 checkpoint 的习惯组织主体、环境、光线、镜头/空间、媒介与风格。
- 用户要求 negative prompt 时，读取 [negative-prompt-strategies.md](../negative-prompt-strategies.md)，将正向 Prompt 与独立 negative prompt 分栏；只排除当前模型和目标确实相关的问题。
- 不把 `--no` 当作 Stable Diffusion 语法，也不无差别堆叠 `masterpiece`、`best quality`、通用解剖词或与目标无关的缺陷列表。
- 构图、姿态、边缘和深度等结构控制交给 ControlNet；风格、人物或产品参考可交给 IP-Adapter。具体预处理器、节点和权重由用户实际 WebUI / ComfyUI 工作流决定。
- 写实任务只排除与目标冲突的过度 HDR、过度数字锐化、塑料皮肤或过度磨皮；不要把合理颗粒、自然高光、真实暗部或目标媒介纹理全部列为缺陷。

## 工作流说明

- 若用户未提供 checkpoint、基础模型或节点图，只给模型无关的 Prompt 与职责建议，不猜测权重。
- 人物参考时把身份、姿态和构图分开声明；IP-Adapter 负责参考特征，ControlNet 负责结构，文字 Prompt 负责目标内容与边界。
- 只有用户确实要求本地工作流参数时，才询问 WebUI / ComfyUI、模型和扩展版本。

## 交付检查

- 正向与负向是否分栏，且负向没有误伤目标媒介？
- ControlNet、IP-Adapter 和文字 Prompt 的职责是否分离？
- 是否避免声称未知 checkpoint 支持某个固定权重或语法？

## Official / canonical sources

- [Stability AI API reference](https://platform.stability.ai/docs/api-reference)
- [ControlNet repository](https://github.com/lllyasviel/ControlNet)
- [IP-Adapter repository](https://github.com/tencent-ailab/IP-Adapter)
