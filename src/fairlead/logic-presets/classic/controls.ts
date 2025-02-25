import { getUID, ClassicPreset as ReteTypes } from 'rete';

type InputControlOptions<N> = {
    label?: string,
    /** Whether the control is readonly. Default is `false` */
    readonly?: boolean,
    /** Initial value of the control */
    initial?: N,
    /** Callback function that is called when the control value changes */
    change?: (value?: N) => void
}

type SelectionOption<T> = {
    label: string,
    value: T
}

export type SelectionProvider<T> = {
    fetchSelectionOptions: () => Promise<SelectionOption<T>[]>
}

export class FairLeadSelectControl<T> extends ReteTypes.Control {
    value?: SelectionOption<T>;
    readonly: boolean;
    provider: SelectionProvider<T>;

    constructor(public selectionProvider: SelectionProvider<T>, public options?: InputControlOptions<SelectionOption<T>>) {
        super()
        this.id = getUID()
        this.readonly = options?.readonly || false
        this.provider = selectionProvider;
    }

    setValue(value?: SelectionOption<T>) {
        this.value = value;
        if (this.options?.change) this.options.change(value)
    }
}

export class FairLeadDividerControl extends ReteTypes.Control {
    constructor(public options?: InputControlOptions<string>) {
        super()
        this.id = getUID()
    }
}

export class FairLeadTextControl extends ReteTypes.Control {
    value?: string
    readonly: boolean
    label?: string
  
    /**
     * @constructor
     * @param options Control options
     */
    constructor(public options?: InputControlOptions<string>) {
        super()
        this.id = getUID()
        this.readonly = options?.readonly || false
        this.label = options?.label
    
        if (typeof options?.initial !== 'undefined') this.value = options.initial
        // console.log('Logic Text Control initialized')
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