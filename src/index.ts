import parser, {OptionType} from './parser'

export default class LessPluginTheme {
    private readonly options?: OptionType
    minVersion = [3, 5, 0]

    constructor(options?: OptionType) {
        this.options = options;
    }

    install(less: any, pluginManager: any) {
        pluginManager.addPreProcessor(new parser(this.options));
    }


}
