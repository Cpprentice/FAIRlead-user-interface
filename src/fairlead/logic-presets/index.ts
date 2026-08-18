// export * as Classic from './classic'
import {StaticEntityNode, EntityNode, SchemaNode, ClassAnnotationNode, StaticClassNode} from './classic/nodes'
import {FairLeadSelectControl, FairLeadTextControl} from './classic/controls'
import {streamSocket, attributeSocket, schemaSocket, classSocket, slotSocket} from './classic/sockets'

export default {
    StaticEntityNode,
    StaticClassNode,
    EntityNode,
    SchemaNode,
    ClassAnnotationNode,
    FairLeadSelectControl,
    FairLeadTextControl,
    streamSocket,
    attributeSocket,
    schemaSocket,
    classSocket,
    slotSocket
}
