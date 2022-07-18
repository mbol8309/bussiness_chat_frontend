import { ReactComponent as SevenZipIcon} from  '../../../static/icons/application_x-7z.svg'
import { ReactComponent as DocIcon} from  '../../../static/icons/application_msword.svg'
import { ReactComponent as TextIcon} from  '../../../static/icons/text_plain.svg'
import { ReactComponent as PdfIcon} from  '../../../static/icons/application_pdf.svg'
import { ReactComponent as ExeIcon} from  '../../../static/icons/application_vnd.microsoft.portable-executable.svg'
import { ReactComponent as RarIcon} from  '../../../static/icons/application_x-rar.svg'
import { ReactComponent as ZipIcon} from  '../../../static/icons/application_zip.svg'
import { ReactComponent as ExcelIcon} from  '../../../static/icons/application_vnd.ms-excel.svg'
import { ReactComponent as PowerPointIcon} from  '../../../static/icons/application_vnd.ms-powerpoint.svg'


const MimeIcons = {
    // 'application/x-7z' : SevenZipIcon,
    'application/msword': DocIcon,
    'text/plain': TextIcon,
    'application/pdf': PdfIcon,
    'application/vnd.microsoft.portable-executable': ExeIcon,
    'application/x-dosexec': ExeIcon,
    // 'application/x-rar': RarIcon,
    'application/zip': ZipIcon,
    'application/vnd.ms-excel': ExcelIcon,
    'application/vnd.ms-powerpoint': PowerPointIcon
}
export default MimeIcons