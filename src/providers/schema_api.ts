import { Entity, EntityApi, Partition, PartitionApi, Schema, SchemaApi } from "schema_api";
import { SelectionProvider } from '@/fairlead/logic-presets/classic/controls'
import { reactive } from "vue";
import { entityGenerationSettings } from "./entity_generation_settings_provider";

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

    async fetch() {
        return this.schemaApi.getAllSchemas()
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
