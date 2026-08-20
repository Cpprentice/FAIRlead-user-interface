import { ClassDefinitionView, Configuration, EnhancementApi, Entity, EntityApi, Partition, PartitionApi, Schema, SchemaApi, SlotDefinitionView } from "schema_api";
import { ExtendedSelectionProvider, SelectionProvider } from '@/fairlead/logic-presets/classic/controls'
import { reactive, ref, watch } from "vue";
import { entityGenerationSettings } from "./entity_generation_settings_provider";
import { deferedPromise, DeferredPromiseType, Mutex, useDebounceFn, UseDebounceFnReturn } from "./util";
import { useRoute } from "vue-router";

export class SchemaProvider implements SelectionProvider<Schema> {

    schemaApi: SchemaApi;

    constructor() {
        this.schemaApi = new SchemaApi()
    }

    async fetchSelectionOptions() {
        let schemas = await this.schemaApi.getAllSchemas()
        return schemas.map(schema => {
            return {
                label: schema.id || '',
                value: schema
            }
        })
    }

    async fetchSelectionLabels() {
        let schemas = await this.schemaApi.getAllSchemas()
        return schemas.map(schema => {
            return schema.id || ''
        })
    }

    async fetch() {
        return this.schemaApi.getAllSchemas()
    }
}

export class SchemaClassProvider implements ExtendedSelectionProvider<ClassDefinitionView> {
    schemaApi: SchemaApi;

    constructor(public schemaId: string) {
        this.schemaApi = new SchemaApi();
    }

    async fetchSelectionOptions() {
        let classes = await (await this.schemaApi.getClassesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return classes.map(cls => {
            return {
                title: cls.name,
                value: cls,
                props: {}
            }
        })
    }

    async fetchSelectionTitles() {
        let classes = await (await this.schemaApi.getClassesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return classes.map(cls => cls.name);
    }

    
}

export class SchemaEntityProvider implements SelectionProvider<Entity> {
    entityApi: EntityApi;

    constructor(public schemaId: string) {
        this.entityApi = new EntityApi();
    }

    async fetchSelectionOptions() {
        let entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return entities.map(entity => {
            return {
                label: entity.entityName[0],
                value: entity
            }
        })
    }

    async fetchSelectionLabels() {
        let entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
        return entities.map(entity => entity.entityName[0])
    }
}

export class SchemaSlotProvider implements ExtendedSelectionProvider<SlotDefinitionView> {
    schemaApi: SchemaApi;

    constructor(public schemaId: string, public classId: string) {
        this.schemaApi = new SchemaApi();
    }

    async fetchSelectionOptions() {
        let slots = await (await this.schemaApi.getSlotsBySchemaAndClassRaw({schemaId: this.schemaId, classId: this.classId, ...entityGenerationSettings})).value();
        return slots.map(slot => {
            return {
                title: slot.name,
                value: slot,
                props: {}
            }
        })
    }

    async fetchSelectionTitles() {
        let slots = await (await this.schemaApi.getSlotsBySchemaAndClassRaw({schemaId: this.schemaId, classId: this.classId, ...entityGenerationSettings})).value();
        return slots.map(slot => slot.name)
    }
}

export class EntityProvider {
    entityApi: EntityApi;

    constructor(public schemaId: string) {
        this.entityApi = new EntityApi()
    }

    async fetch() {
        return (await this.entityApi.getEntitiesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value()
    }

    async fetchOne(entityId: string) {
        return (await this.entityApi.getEntityByIdRaw({schemaId: this.schemaId, entityId: entityId, ...entityGenerationSettings})).value();
    }
}


export class ClassProvider {
    schemaApi: SchemaApi;

    constructor(public schemaId: string) {
        this.schemaApi = new SchemaApi();
    }

    async fetch() {
        console.trace('Starting fetch of classes')
        return (await this.schemaApi.getClassesBySchemaRaw({schemaId: this.schemaId, ...entityGenerationSettings})).value();
    }

    async fetchFiltered(selectedClasses: string[]) {
        return (await this.schemaApi.getClassesBySchemaRaw({schemaId: this.schemaId, classFilter: selectedClasses, ...entityGenerationSettings})).value();
    } 
}


class CachedClassProvider {
    
    requestSentFor: Map<string, DeferredPromiseType<void>>;
    filteredRequestSentFor: Map<string, DeferredPromiseType<void>>;

    classesSchema: string = "";
    filteredClassesSchema: string = "";

    classes: ClassDefinitionView[];
    filteredClasses: ClassDefinitionView[];

    private _mutex: Mutex;
    // debouncedFetch: UseDebounceFnReturn<(schemaId: string) => Promise<void>>;

    constructor() {
        this.requestSentFor = new Map<string, DeferredPromiseType<void>>();
        this.filteredRequestSentFor = new Map<string, DeferredPromiseType<void>>();
        this.classes = [];
        this.filteredClasses = [];
        this._mutex = new Mutex();
        // this.debouncedFetch = useDebounceFn(async (schemaId: string) => {
        //     const classProvider = new ClassProvider(schemaId);
        //     this.classes = await classProvider.fetch();
        //     const x = 42;
        // }, 500, {maxWait: 3000, rejectOnCancel: false});
    }

    async fetchClasses(schemaId: string) {
        
        const release = await this._mutex.lock();
        let promise: DeferredPromiseType;
        try {
            if (this.requestSentFor.has(schemaId)) return await this.requestSentFor.get(schemaId);
            promise = deferedPromise();
            this.requestSentFor.set(schemaId, promise);
        } finally {
            release();
        }

        const classProvider = new ClassProvider(schemaId);
        this.classes = await classProvider.fetch();
        this.requestSentFor.delete(schemaId);
        this.classesSchema = schemaId;
        promise.resolve();
    }

    async fetchFilteredClasses(schemaId: string, selectedClasses: string[]) {
        const release = await this._mutex.lock();
        let promise: DeferredPromiseType;
        try {
            if (this.filteredRequestSentFor.has(schemaId)) return this.filteredRequestSentFor.get(schemaId);
            promise = deferedPromise();
            this.filteredRequestSentFor.set(schemaId, promise);
        } finally {
            release();
        }

        const classProvider = new ClassProvider(schemaId);
        if (!selectedClasses || selectedClasses.length == 0) {
            this.filteredClasses = [];
        } else {
            this.filteredClasses = await classProvider.fetchFiltered(selectedClasses);
        }
        this.filteredRequestSentFor.delete(schemaId);
        this.filteredClassesSchema = schemaId;
        promise.resolve();
    }

    // async fetchClassesDebounced(schemaId: string) {
    //     await this.debouncedFetch(schemaId);
    //     const _ = 42;
    // }
}

const cachedClassProvider = ref(new CachedClassProvider());

export {
    cachedClassProvider
}


export class ClassSelectionProvider implements SelectionProvider<ClassDefinitionView> {
    constructor(private schemaId: string) {}

    async fetchSelectionOptions() {
        await cachedClassProvider.value.fetchClasses(this.schemaId);
        const classes = cachedClassProvider.value.classes;
        return classes.map((x) => {
            return {
                label: x.name,
                value: x
            }
        });
    }

    async fetchSelectionLabels() {
        await cachedClassProvider.value.fetchClasses(this.schemaId);
        const classes = cachedClassProvider.value.classes;
        return classes.map((x) => x.name);
    }
}


const classNameList = ref<string[]>([]);
watch(() => cachedClassProvider.value.classes, (newClasses, oldClasses) => {
    classNameList.value = newClasses.map((x) => x.name);
},  { deep: true })
export { classNameList }


// const legacyEntityNameList = ref<string[]>([]);
// const route = useRoute();

// watch(() => route.fullPath, async (newPath, oldPath) => {
//     if (route.name != 'not-found') {
//         if (route.name == 'filtered-schema') {
//             const provider = new SchemaEntityProvider(route.params.schemaId)
//             legacyEntityNameList.value = await provider.fetchSelectionLabels()
//         }
//     }
// })


// const routeSensitiveClassNameList = ref<string[]>([]);
// watch([legacyEntityNameList, classNameList], () => {
//     if (route.name == 'filtered-schema') {
//         routeSensitiveClassNameList.value = legacyEntityNameList.value;
//     } else if (route.name == 'filtered-linkml-schema') {
//         routeSensitiveClassNameList.value = classNameList.value;
//     } else {
//         routeSensitiveClassNameList.value = [];
//     }
// })
// export { routeSensitiveClassNameList }



class CachedEntityProvider {
    entityApi: EntityApi;
    partitionApi: PartitionApi;
    partitions: Partition[];
    entities: Entity[];

    constructor() {
        this.entityApi = new EntityApi()
        this.partitionApi = new PartitionApi()
        this.entities = [];
        this.partitions = [];
    }

    async fetchEntities(schemaId: string) {
        this.entities = await (await this.entityApi.getEntitiesBySchemaRaw({ schemaId: schemaId, ...entityGenerationSettings })).value();
        // this.entities = await this.entityApi.getEntitiesBySchema(schemaId, ...entityGenerationSettings)
        // this.entities.length = 0  // truncate existing content
        // this.entities.push(...await this.entityApi.getEntitiesBySchema(schemaId))
    }

    async fetchFilteredEntities(schemaId: string, entityNames: string[]) {
        this.entities = await (await this.entityApi.getEntitiesBySchemaRaw({schemaId, entityFilter: entityNames, ...entityGenerationSettings})).value()
    }

    async fetchPartitions(schemaId: string) {
        this.partitions = await (await this.partitionApi.getPartitionedEntitiesBySchemaRaw({schemaId: schemaId, ...entityGenerationSettings})).value();
        this.entities = this.partitions[0].entities ?? [];
        // this.partitions.length = 0
        // this.partitions.push(...await this.partitionApi.getPartitionedEntitiesBySchema(schemaId));
        // this.entities.length = 0
        // this.entities.push(...this.partitions[0].entities)
    }

    switchPartition(partitionName: string) {
        const idx = this.partitions.findIndex((partition) => partition.title === partitionName)
        this.entities = this.partitions[idx].entities ?? []
    }
}

const cachedEntityProvider = reactive(new CachedEntityProvider());

export {cachedEntityProvider}


class CachedMappingProvider {
    // mappingApi: MappingApi;
    // mappings: Mapping[];
    mapping: string[] | null;

    constructor() {
        this.mapping = null;
    }

    async fetchMapping(mappingId: string) {
        this.mapping = await Promise.resolve(["123", "456"]);
    }

    clearMapping() {
        this.mapping = [];
    }
}

const cachedMappingProvider = reactive(new CachedMappingProvider());

export {cachedMappingProvider}

const config = new Configuration()
export const enhancementApi = new EnhancementApi(config);