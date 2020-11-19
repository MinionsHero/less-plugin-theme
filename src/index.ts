import PreParser, {OptionType} from './preParser'
import PostParser from "@/postParser";


export default class LessPluginTheme {
    private readonly options?: OptionType & { mergeSelector: boolean }
    minVersion = [3, 5, 0]

    constructor(options?: OptionType & { mergeSelector: boolean }) {
        this.options = options;
    }

    install(less: any, pluginManager: any) {
        const preParser = new PreParser(this.options)
        pluginManager.addPreProcessor(preParser);
        if (!this.options || this.options.mergeSelector) {
            pluginManager.addPostProcessor(new PostParser(preParser), 1)
        }
    }

}
