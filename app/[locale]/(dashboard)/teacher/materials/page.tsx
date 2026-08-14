import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { USER_ROLES } from '@/constants/roles.const';

import { requireRole } from '@/lib/auth';
import { CourseService, MaterialService, getStorageStatus } from '@/lib/services';

import { MaterialsScreen } from '@/components/materials';

const courseService = new CourseService();
const materialService = new MaterialService();

type TeacherMaterialsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherMaterialsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('MATERIALS_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function TeacherMaterialsPage() {
  const sessionUser = await requireRole(USER_ROLES.TEACHER);

  const l10n = await getTranslations();

  const [courseResult, materialResult, storageStatus] = await Promise.all([courseService.list(), materialService.list(), getStorageStatus()]);

  /*
    Only the teacher's own courses reach the picker, and only their own files reach the
    list. Both are filtered from the session rather than a query parameter, so one
    teacher cannot read another's repository by editing the URL — and the service
    refuses regardless.
  */
  const courses = courseResult.result
    .filter(x => x.assignedTeacherId === sessionUser.userId)
    .map(x => ({ courseId: x.courseId, code: x.code, title: x.title }));

  const materials = materialResult.result.filter(x => x.uploadedById === sessionUser.userId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">{l10n('MATERIALS_TITLE')}</h1>
        <p className="text-muted-foreground text-sm">{l10n('MATERIALS_INTRO')}</p>
        <p className="text-muted-foreground text-xs">{l10n('MATERIALS_COUNT', { count: materials.length })}</p>
      </div>

      <MaterialsScreen
        materials={materials}
        courses={courses}
        storageBlocked={storageStatus.full}
        storageNearFull={storageStatus.nearFull}
        labels={{
          title: l10n('MATERIALS_TITLE'),
          intro: l10n('MATERIALS_INTRO'),
          count: l10n('MATERIALS_COUNT', { count: materials.length }),
          uploadTitle: l10n('MATERIALS_UPLOAD_TITLE'),
          uploadCta: l10n('MATERIALS_UPLOAD_CTA'),
          uploadDescription: l10n('MATERIALS_UPLOAD_DESCRIPTION'),
          fieldCourse: l10n('MATERIALS_FIELD_COURSE_LABEL'),
          fieldTitle: l10n('MATERIALS_FIELD_TITLE_LABEL'),
          fieldFile: l10n('MATERIALS_FIELD_FILE_LABEL'),
          uploadSubmit: l10n('MATERIALS_UPLOAD_SUBMIT'),
          uploading: l10n('MATERIALS_UPLOADING'),
          storageWarning: l10n('MATERIALS_STORAGE_WARNING'),
          storageFull: l10n('MATERIALS_STORAGE_FULL'),
          tableLabel: l10n('MATERIALS_TABLE_LABEL'),
          columnTitle: l10n('MATERIALS_TABLE_TITLE'),
          columnCourse: l10n('MATERIALS_TABLE_COURSE'),
          columnSize: l10n('MATERIALS_TABLE_SIZE'),
          columnDate: l10n('MATERIALS_TABLE_DATE'),
          columnActions: l10n('MATERIALS_TABLE_ACTIONS'),
          download: l10n('MATERIALS_ACTION_DOWNLOAD'),
          remove: l10n('MATERIALS_ACTION_DELETE'),
          emptyTitle: l10n('MATERIALS_EMPTY_TITLE'),
          emptyDescription: l10n('MATERIALS_EMPTY_DESCRIPTION'),
          deleteTitle: l10n('MATERIALS_DELETE_TITLE'),
          deleteDescription: l10n('MATERIALS_DELETE_DESCRIPTION'),
          deleteConfirm: l10n('MATERIALS_DELETE_CONFIRM'),
          deleting: l10n('MATERIALS_DELETE_WORKING'),
          cancel: l10n('MATERIALS_DIALOG_CANCEL'),
          toastUploaded: l10n('MATERIALS_TOAST_UPLOADED'),
          toastDeleted: l10n('MATERIALS_TOAST_DELETED'),
          searchLabel: l10n('MATERIALS_SEARCH_LABEL'),
          searchPlaceholder: l10n('MATERIALS_SEARCH_PLACEHOLDER'),
          courseFilter: l10n('MATERIALS_FILTER_COURSE'),
          typeFilter: l10n('MATERIALS_FILTER_TYPE'),
          allCourses: l10n('MATERIALS_FILTER_ALL_COURSES'),
          allTypes: l10n('MATERIALS_FILTER_ALL_TYPES'),
          typePdf: l10n('MATERIALS_TYPE_PDF'),
          typeDocument: l10n('MATERIALS_TYPE_DOCUMENT'),
          typePresentation: l10n('MATERIALS_TYPE_PRESENTATION'),
          typeSpreadsheet: l10n('MATERIALS_TYPE_SPREADSHEET'),
          typeImage: l10n('MATERIALS_TYPE_IMAGE'),
          typeArchive: l10n('MATERIALS_TYPE_ARCHIVE'),
          typeText: l10n('MATERIALS_TYPE_TEXT'),
          sortLabel: l10n('MATERIALS_SORT_LABEL'),
          sortName: l10n('MATERIALS_SORT_NAME'),
          sortSize: l10n('MATERIALS_SORT_SIZE'),
          sortDate: l10n('MATERIALS_SORT_DATE'),
          dropzone: l10n('MATERIALS_DROPZONE'),
          dropActive: l10n('MATERIALS_DROPZONE_ACTIVE'),
          removeFile: l10n('MATERIALS_FILE_REMOVE'),
          fieldDescription: l10n('MATERIALS_FIELD_DESCRIPTION'),
          edit: l10n('MATERIALS_ACTION_EDIT'),
          toastUpdated: l10n('MATERIALS_TOAST_UPDATED'),
          editTitle: l10n('MATERIALS_EDIT_TITLE'),
          editDescription: l10n('MATERIALS_EDIT_DESCRIPTION'),
          editReplace: l10n('MATERIALS_EDIT_REPLACE'),
          editDropActive: l10n('MATERIALS_EDIT_DROP_ACTIVE'),
          editKeep: l10n('MATERIALS_EDIT_KEEP'),
          updating: l10n('MATERIALS_EDIT_WORKING'),
          viewer: {
            view: l10n('MEDIA_VIEWER_VIEW'),
            download: l10n('MEDIA_VIEWER_DOWNLOAD'),
            preview: l10n('MEDIA_VIEWER_PREVIEW'),
            zoomHint: l10n('MEDIA_VIEWER_ZOOM_HINT'),
            zoomOut: l10n('MEDIA_VIEWER_ZOOM_OUT'),
            zoomIn: l10n('MEDIA_VIEWER_ZOOM_IN'),
            reset: l10n('MEDIA_VIEWER_RESET'),
          },
          errors: {
            fileRequired: l10n('MATERIALS_ERROR_FILE_REQUIRED'),
            fileTooLarge: l10n('MATERIALS_ERROR_FILE_TOO_LARGE'),
            fileType: l10n('MATERIALS_ERROR_FILE_TYPE'),
            titleRequired: l10n('MATERIALS_ERROR_TITLE_REQUIRED'),
            notOwnCourse: l10n('MATERIALS_ERROR_NOT_OWN_COURSE'),
            notOwnFile: l10n('MATERIALS_ERROR_NOT_OWN_FILE'),
            notFound: l10n('MATERIALS_ERROR_NOT_FOUND'),
            courseNotFound: l10n('MATERIALS_ERROR_COURSE_NOT_FOUND'),
            storageFull: l10n('MATERIALS_ERROR_STORAGE_FULL'),
            generic: l10n('MATERIALS_ERROR_GENERIC'),
          },
        }}
      />
    </div>
  );
}
