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

export type ValueType<Multiple extends boolean, T> =
    Multiple extends true
    ? T[]
    : T;

type SelectionOption<T> = {
    label: string,
    value: T
}

export type ExtendedSelectionOption<T> = {
    title: string
    value: T
    props: Record<string, any>
}

export type SelectionProvider<T> = {
    fetchSelectionOptions: () => Promise<SelectionOption<T>[]>
    fetchSelectionLabels: () => Promise<string[]>
}

export type ExtendedSelectionProvider<T> = {
    fetchSelectionOptions: () => Promise<ExtendedSelectionOption<T>[]>
    fetchSelectionTitles: () => Promise<string[]>
}

export abstract class FairLeadControl<T> extends ReteTypes.Control {
    value?: T;
    constructor(public options?: InputControlOptions<T>) {
        super()
    }

    setValue(value?: T) {
        this.value = value;
        if (this.options?.change) this.options.change(value);  // TODO this could fire twice if we programatically change the value - as the UI will probably call setValue again?
    }
}

export class FairLeadSelectControl<T> extends FairLeadControl<SelectionOption<T>> {
    // value?: SelectionOption<T>;
    readonly: boolean;
    provider: SelectionProvider<T>;

    constructor(public selectionProvider: SelectionProvider<T>, options?: InputControlOptions<SelectionOption<T>>) {
        super(options)
        this.id = getUID()
        this.readonly = options?.readonly || false
        this.provider = selectionProvider;
    }

    // setValue(value?: SelectionOption<T>) {
    //     this.value = value;
    //     if (this.options?.change) this.options.change(value)
    // }
}

export class FairLeadPreparedSelectControl<Multiple extends boolean, T> extends FairLeadControl<ValueType<Multiple, ExtendedSelectionOption<T>>> {
    dataAvailablePromise: Promise<ExtendedSelectionOption<T>[]>
    readonly: boolean;
    multiple: Multiple;

    // only type overrides are supported - but there must only be one ctor implementation
    constructor(selectionProvider: ExtendedSelectionProvider<T>, multiple: Multiple, options?: InputControlOptions<ValueType<Multiple, ExtendedSelectionOption<T>>>);
    constructor(items: ExtendedSelectionOption<T>[], multiple: Multiple, options?: InputControlOptions<ValueType<Multiple, ExtendedSelectionOption<T>>>);

    constructor(dataOrProvider: ExtendedSelectionProvider<T> | ExtendedSelectionOption<T>[], multiple: Multiple, options?: InputControlOptions<ValueType<Multiple, ExtendedSelectionOption<T>>>) {
        super(options)
        this.id = getUID()
        if (Array.isArray(dataOrProvider)) {
            this.dataAvailablePromise = Promise.resolve(dataOrProvider);
        } else {
            this.dataAvailablePromise = dataOrProvider.fetchSelectionOptions()
        }
        this.readonly = false;
        this.multiple = multiple;
    }
}

export class FairLeadDividerControl extends FairLeadControl<string> {
    constructor(options?: InputControlOptions<string>) {
        super(options)
        this.id = getUID()
    }
}

export class FairLeadTextControl extends FairLeadControl<string> {
    // value?: string
    readonly: boolean
    label?: string
  
    /**
     * @constructor
     * @param options Control options
     */
    constructor(options?: InputControlOptions<string>) {
        super(options)
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
    // setValue(value?: string) {
    //     this.value = value
    //     if (this.options?.change) this.options.change(value)
    // }
}
