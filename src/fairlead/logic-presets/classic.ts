import { ClassicPreset as ReteClassicPreset, getUID } from 'rete';

type InputControlOptions<N> = {
    /** Whether the control is readonly. Default is `false` */
    readonly?: boolean,
    /** Initial value of the control */
    initial?: N,
    /** Callback function that is called when the control value changes */
    change?: (value?: N) => void
}

export class FairLeadTextControl extends ReteClassicPreset.Control {
    value?: string
    readonly: boolean
  
    /**
     * @constructor
     * @param options Control options
     */
    constructor(public options?: InputControlOptions<string>) {
        super()
        this.id = getUID()
        this.readonly = options?.readonly
    
        if (typeof options?.initial !== 'undefined') this.value = options.initial
    }
  
    /**
     * Set control value
     * @param value Value to set
     */
    setValue(value?: string) {
        this.value = value
        if (this.options?.change) this.options.change(value)
    }
}

export class FairLeadFileControl extends ReteClassicPreset.Control {
    value?: File

    /**
     * @constructor
     * @param options Control options
     */
    constructor(public options?: InputControlOptions<File>) {
        super()
        this.id = getUID()
        this.readonly = options?.readonly
    
        if (typeof options?.initial !== 'undefined') this.value = options.initial
    }
    
    /**
     * Set control value
     * @param value Value to set
     */
    setValue(value?: File) {
        this.value = value
        if (this.options?.change) this.options.change(value)
    }
}

export class FairLeadSelectControl<T> extends ReteClassicPreset.Control {
    value?: T;
    readonly: boolean;

    constructor(public selectables: T[], public options?: InputControlOptions<T>) {
        super()
        this.id = getUID()
        this.readonly = options?.readonly || false
    }

    setValue(value?: T) {
        this.value = value;
        if (this.options?.change) this.options.change(value)
    }
}
