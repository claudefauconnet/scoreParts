var Common=(function(){

    var self={}

    self.fillSelectOptions = function (selectId, data, withBlanckOption, textfield, valueField, selectedValue) {
        $("#" + selectId)
            .find("option")
            .remove()
            .end();
        if (withBlanckOption) {
            $("#" + selectId).append(
                $("<option>", {
                    text: "",
                    value: "",
                })
            );
        }

        if (Array.isArray(data)) {
            data.forEach(function (item, _index) {
                var text, value;
                if (textfield) {
                    if (item[textfield] && item[textfield].value && item[valueField].value) {
                        text = item[textfield].value;
                        value = item[valueField].value;
                    } else {
                        text = item[textfield];
                        value = item[valueField];
                    }
                } else {
                    text = item;
                    value = item;
                }
                var selected;
                if (selectedValue && value == selectedValue) {
                    selected = "selected";
                }
                $("#" + selectId).append(
                    $("<option>", {
                        text: text,
                        value: value,
                        selected: selected,
                    })
                );
            });
        } else {
            for (var key in data) {
                var item = data[key];
                $("#" + selectId).append(
                    $("<option>", {
                        text: item[textfield] || item,
                        value: item[valueField] || item,
                    })
                );
            }
        }
    };
    return self;

})()