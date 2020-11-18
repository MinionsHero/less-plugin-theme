import preParser, {OptionType} from './preParser'
import postParser from "@/postParser";
import PostParser from "@/postParser";


export default class LessPluginTheme {
    private readonly options?: OptionType & { mergeSelector: boolean }
    minVersion = [3, 5, 0]

    constructor(options?: OptionType & { mergeSelector: boolean }) {
        this.options = options;
    }

    install(less: any, pluginManager: any) {
        pluginManager.addPreProcessor(new preParser(this.options));
        if (!this.options || this.options.mergeSelector) {
            pluginManager.addPostProcessor(new PostParser(), 1)
        }
    }

}
