let selfCtx = self.ctx;
let entity;    
let intervalInstance;

let STREAM_REQUEST_INTERVAL = 1000;
let RPC_START_METHOD = "start_kvs_stream";
let SERVER_API_CALL_RESPONSE = 'server-api-call-response';

if (!deviceIsConnected()) return;

    // Services
    let $injector = selfCtx.$scope.$injector;    
    let $mdDialog = $injector.get('$mdDialog');
    let $document = $injector.get('$document');
    let attributeService = $injector.get('attributeService');

    let scope = selfCtx.$scope;    

    function deviceIsConnected() {
        if (!selfCtx.stateController) return false;
       
        entity = selfCtx.stateController.getEntityId();
        if (!entity) return false;
        
        return true;
    }

    register(entity, selfCtx);
    
    function register(entity, ctx){
        let subscriptionInfo = {
            type: 'entity',
            entityType: entity.entityType,
            entityId: entity.id
        };
        
        subscriptionInfo.attributes = [{
            name: 'lastDisconnectTime',
            label: 'lastDisconnectTime'
        },{
            name: 'lastConnectTime',
            label: 'lastConnectTime'
        },{
            name: 'inactivityAlarmTime',
            label: 'inactivityAlarmTime'
        }, {
            name: 'lastActivityTime',
            label: 'lastActivityTime'
        }];
        
        let subscriptionOptions = {
            callbacks: {
                onDataUpdated: () => {
                    isConnected(entity, attributeService).then(connected => {
                        selfCtx.$scope.connected = connected;
                    }).catch(err=>console.log(`There has been an error under 'fetchAttributes': ${err}`));
                }