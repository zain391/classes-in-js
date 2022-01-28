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
            }
        }
        
        ctx.subscriptionApi.createSubscriptionFromInfo('latest',[subscriptionInfo],subscriptionOptions,false,true);
    }
    
    function isConnected(entity, attributeService){
        return new Promise((resolve, reject)=>{
            
            attributeService.getEntityAttributesValues(entity.entityType, entity.id, 'SERVER_SCOPE').then(data=>{
                let lastDisconnectTimeObj = data.find(item => item.key == "lastDisconnectTime");
                
                let lastConnectTimeObj = data.find(item => item.key == "lastConnectTime");
                
                let inactivityAlarmTimeObj = data.find(item => item.key == "inactivityAlarmTime");
                
                let lastActivityTimeObj = data.find(item => item.key == "lastActivityTime");
                
                if(!lastConnectTimeObj || !lastDisconnectTimeObj) {
                    return reject("'lastConnectTime' or 'lastDisconnectTime' attributes are missing");
                }

                
                let connected = (lastConnectTimeObj.value > lastDisconnectTimeObj.value) && (inactivityAlarmTimeObj.value < lastActivityTimeObj.value);
                
                return resolve(connected);
            })     
        })
    }

    selfCtx.$scope.openKvsModal = function () {        
        selfCtx.controlApi.sendOneWayCommand(RPC_START_METHOD);

        $mdDialog.show({
            controller: ['$scope', '$mdDialog', '$q', '$interval', 'attributeService', kvsDialogController],
            controllerAs: 'vm',
            template: kvsTemplate,
            parent: angular.element($document[0].body),
            multiple: true,
            clickOutsideToClose: false
        });
    }

    function kvsDialogController($scope, $mdDialog, $q, $interval, attributeService) {
        var vm = this;
        vm.hospitalName;
        vm.initialized = false;
        vm.validStream = true;
        vm.accessKeyId;
        vm.secretAccessKey;
        vm.regionObj;
        vm.tenantId;
        vm.serial;
        vm.subscriptionRef;
        init();
    }
    
    function init() {            
        registerServerApiCallResponse(entity, selfCtx);
        
        fetchAttributes().then(result => {
            assumeRole();     
        });
    }        
    
    function registerServerApiCallResponse(entity, ctx){
        scope.firstTriggerHappened = false;
        
        let subscriptionInfo = {
            type: 'entity',
            entityType: entity.entityType,
            entityId: entity.id
        };
        
        subscriptionInfo.attributes = [{
            name: SERVER_API_CALL_RESPONSE,
            label: SERVER_API_CALL_RESPONSE
        }];
        