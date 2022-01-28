self.onInit = function() {
    var scope = self.ctx.$scope;
    var id = self.ctx.$scope.$injector.get('utils').guid();
    scope.tableId = "table-"+id;
    scope.ctx = self.ctx;
}

self.onDataUpdated = function() {
    let scope = self.ctx.$scope;
    
    let newAlarmList = scope.ctx.defaultSubscription.alarms;
    let newRealTime = scope.ctx.defaultSubscription.timeWindowConfig.realtime;
    fetchAttributes(scope).then(attributes=>{
        setTimeout(() => flickerCallForHelpRows(), 100);

        if (!attributes.muteAlarms && !wasRealTimeChanged(scope.realTime, newRealTime)) {
            // newAlarmListCount - on refresh we don't want to flicker the first row. only on second time the event fires.
            if (isNewData(scope.alarmList, newAlarmList)) {
                activateAlarm(scope, attributes);
            }
        
        }
        
        scope.alarmList = newAlarmList;
        scope.realTime = newRealTime;
        self.ctx.$scope.$broadcast('alarms-table-data-updated', self.ctx.$scope.tableId);
        
    }).catch(err=>{
        console.log(`There has been an error activating alarm under 'fetchAttributes': ${err}`);
        self.ctx.$scope.$broadcast('alarms-table-data-updated', self.ctx.$scope.tableId);
    });
    
}

function isNewData(alarmList, newAlarmList){
    if (!alarmList) return false;
    
    let isNew = false;
    
    if (newAlarmList.length > alarmList.length){
        isNew = true;
    }
    
    if (newAlarmList.length == alarmList.length &&
        newAlarmList[0].createdTime != alarmList[0].createdTime) {
        isNew = true;    
    }
    
    return isNew;
}

function wasRealTimeChanged(realTime, newRealTime){
    if (!realTime) return false;

    return realTime.interval != newRealTime.interval || 
            realTime.timewindowMs != newRealTime.timewindowMs;
}

function fetchAttributes(scope){
    return new Promise((resolve, reject)=>{
        let attributeService = scope.$injector.get('attributeService');
        let deviceService = scope.$injector.get('deviceService');
        let hospitalAliasId = scope.ctx.aliasController.getEntityAliasId("hospital-env");
        
        scope.ctx.aliasController.getAliasInfo(hospitalAliasId).then(hospital=>{
            
            if (!hospital.currentEntity){
                return reject("'hospital-env' alias is missing");
            }
            
            attributeService.getEntityAttributesValues(hospital.currentEntity.entityType, hospital.currentEntity.id, 'SERVER_SCOPE').then(data=>{
                    
                    let muteAlarms = data.find(item => item.key == "mute_alarms_dashboard").value;
                	let hospitalName = data.find(item => item.key == "hospital-name").value;
                	let apiUrl = data.find(item => item.key == "api-url").value;
                	let apiKey = data.find(item => item.key == "x-api-key").value;
                    let tenantId = hospital.currentEntity.origEntity.tenantId.id;
                    
                	return resolve({
                	    muteAlarms,
                	    hospitalName,
                	    apiUrl,
                	    apiKey,
                	    tenantId
                    });
                	
                	
                // 	deviceService.getDevice(entity.entityId).then(device=>{
                //         let tenantId = device.tenantId.id;
                            
                //         return resolve({
                //     	    muteAlarms,
                //     	    hospitalName,
                //     	    apiUrl,
                //     	    apiKey,
                //     	    tenantId
                //     	});
                //     })
                	
            })
            
        })
        
        
    })
}

function activateAlarm(scope, attributes){
    
    let startFlickerTime = 100;
    let stopFlickerTime = 5000;

    setTimeout(function() {
        playSound(scope, attributes);
        flickerCallForHelpRows();
        let row = self.ctx.$container.find("tbody tr").first().find("td");
        let isCallForHelp = false;

        row.toArray().forEach(element => {
            if ($(element).text().includes('CALL FOR HELP')) {
                isCallForHelp = true;
            }
        })
        
        if (!isCallForHelp) {
            row.addClass("flicker");

            clearTimeout(self.ctx.$scope.stopFlickerReference);

            self.ctx.$scope.stopFlickerReference = setTimeout(function() {
                row.removeClass("flicker");
            }, stopFlickerTime);
        }
        
    }, startFlickerTime);
}

function flickerCallForHelpRows() {
    const CALL_FOR_HELP_MESSAGE = "CALL FOR HELP";
    let rows = self.ctx.$scope.ctx.$container.find("tbody tr td").toArray();
    rows.forEach((element, index) => {
        let rowsElement = $(element);
        if (rowsElement.text().includes(CALL_FOR_HELP_MESSAGE)) {
            let parent = rowsElement.parent();
            let repliedElement = rows[index + 1]; // TO CHANGE IF NEW COLUMN BETWEEN
            if (!$(repliedElement).text().length) {
                parent.children().toArray().forEach(child => $(child).addClass("flicker"));
            }
        }
    })
}

function playSound(scope, attributes) {
    let $http = scope.$injector.get('$http');
    $http.defaults.headers.common["x-api-key"] = attributes.apiKey;
    
    $http.post(`${attributes.apiUrl}/get`, {
		keys: [`${attributes.hospitalName}/system/power_on.mp3`],
		tenantId: attributes.tenantId,
        hospital: attributes.hospitalName
	}).then(result => {
		playSoundByUrl(result.data.body.urls[0]);
	})
}

function playSoundByUrl(url) {
	var a = new Audio(url);
	a.play();
}

self.actionSources = function() {
    return {
        'actionCellButton': {
            name: 'widget-action.action-cell-button',
            multiple: true
        },
        'rowClick': {
            name: 'widget-action.row-click',
            multiple: false
        }
    };
}


self.onDestroy = function() {
}