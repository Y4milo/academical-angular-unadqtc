import {Dictionary} from '../dictionary.model';

/**
 * Modelo que representa un Event Question.
 */
export interface Event {
  id?: number;
  title?: string;
  event_mode?: Dictionary;
  attendance_percentage?: number;
  link_group?: string;
  slug?: string
  url_banner?: string;
  description?: string;
  url_description?: string;
}

