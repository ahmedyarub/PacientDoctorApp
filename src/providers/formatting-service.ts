import {Injectable} from '@angular/core';

@Injectable()
export class FormattingService {
    data: any = null;

    constructor() {
    }

    formata_campo(target: any, tipo: string) {
        if(target.value.length == 0)
            return;

        switch (tipo) {
            case "telefone":
            case "mobile":
                return this.formata_telefone(target);

            case "name":
                return this.formata_nome(target);
        }
    }

    private formata_telefone(target: any) {
        var i = 0, v = target.value.replace(/\D/g, '');

        target.value = (v.length >= 11 ? "(##)#####-####" : "(##)####-####").replace(/#/g, _ => v[i++] || '');
    }

    private formata_nome(target: any) {
        var nome_exclusao = [
            'de',
            'do',
            'da',
            'dos',
            'das'
        ];

        var v = target.value.replace(/[^a-zA-Z\.\- ]/gi, '');

        target.value = v.replace(/\w\S*/g, function (txt) {
            if (nome_exclusao.indexOf(txt.toLowerCase()) == -1)
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            else
                return txt.toLowerCase();
        });
    }
}