const COMMUNICATION_LEVEL_ATTRIBUTE = "communication-level";
const ENTITY_ID_ATTRIBUTE = "tenant-id";

const optionsList = [
    {
        index: 1,
        label: "One-way",
        labelTwo: "Receive incoming messages from the dashboard (Orientation, ﻿Greetings or Music only). Requires no action from the patient.",
        tooltip: "Recommended for non-responsive patients.",
        value: [
            {
                key: COMMUNICATION_LEVEL_ATTRIBUTE,
                value: "1"
            }
        ]
    }, {
        index: 2,
        label: "Two-way",
        labelTwo: "Allow receiving all communication from the dashboard. ﻿Requires the patient's input to approve incoming messages.",
        tooltip: "Recommended for patients who possess cognition and can respond to commands.",
        value: [
            {
                key: COMMUNICATION_LEVEL_ATTRIBUTE,
                value: "2"
            }
        ]
    }, {
        index: 3,
        label: "Advanced",
        labelTwo: "Two-way communication plus connecting the EyeControl to external communication platforms (this feature is not available to all facilities)",
        tooltip: "Recommended for advanced users who possess cognition and can control and initiate communication.",
        value: [
            {
                key: COMMUNICATION_LEVEL_ATTRIBUTE,
                value: "3",
            }
        ]
    }
];
let entityId, deviceService;

self.onInit = function() {
    
    let selfCtx = self.ctx;
    // Services 
    let $injector = selfCtx.$scope.$injector;
    let attributeService = $injector.get('attributeService');
    deviceService = $injector.get('deviceService');

    let scope = selfCtx.$scope;
    scope.options = optionsList;


    scope.optionChanged = function (idSelected) {
        const optionSelected = optionsList.find(opt => opt.index == idSelected);
        attributeService.saveEntityAttributes("DEVICE", entityId, "SHARED_SCOPE", [...optionSelected.value]);
    }

}

self.onDataUpdated = function() {
    let scope = self.ctx.$scope;
    const data = self.ctx.data;
    const communicationLevel = getValueFromData(data, COMMUNICATION_LEVEL_ATTRIBUTE);
    entityId = getDeviceId(self.ctx);
    updateRadioBtn(communicationLevel);

    function getValueFromData(data, attributeName) {
        const dataObj = data.find(element => element.dataKey.name == attributeName);

        return (dataObj) && (dataObj.data) && (dataObj.data[0]) ? dataObj.data[0][1] : "";
    }

    function getDeviceId(selfCtx) {
        const entityId = selfCtx.stateController.getEntityId();

        return entityId.id;
    }

    function updateRadioBtn(communicationLevelValue) {
        const radioToSelect = optionsList.find(opt => opt.value[0].value == communicationLevelValue);

        scope.optionSelected = (radioToSelect) ? radioToSelect.index : "";   
    }
}