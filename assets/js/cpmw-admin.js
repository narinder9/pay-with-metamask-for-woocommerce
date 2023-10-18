
jQuery(document).ready(function ($) {
    var url = window.location.href;
    if (url.includes('page=cpmw-metamask-settings')) {
        $('[href="admin.php?page=cpmw-metamask-settings"]').parent('li').addClass('current');
    }

    var data = $('#adminmenu #toplevel_page_woocommerce ul li a[href="admin.php?page=cpmw-metamask-settings"]');
    data.each(function () {
        if ($(this).is(':empty')) {
            $(this).hide();
        }
    });

const selectElement = document.querySelector('select[name="cpmw_settings[Chain_network]"]');
const optionToDisableFrom = selectElement.querySelector('option[value="0x61"]');
let option = optionToDisableFrom.nextElementSibling;

while (option) {
    option.disabled = true;
    option = option.nextElementSibling;
}

});


