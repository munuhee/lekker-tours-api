import * as tourService from '../services/tour.service.js';
import { sendData, buildPageMeta } from '../utils/respond.js';
import { revalidate } from '../utils/revalidate.js';

/* ---------- public ---------- */

export async function listPublicTours(req, res) {
  const { items, total, page, limit } = await tourService.listTours(req.query, {
    publishedOnly: true,
  });
  sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
}

export async function getPublicTour(req, res) {
  const tour = await tourService.getTourBySlug(req.params.slug, { publishedOnly: true });
  sendData(res, tour);
}

export async function getRelated(req, res) {
  const related = await tourService.getRelatedTours(req.params.slug);
  sendData(res, related);
}

/* ---------- admin ---------- */

export async function listAdminTours(req, res) {
  const { items, total, page, limit } = await tourService.listTours(req.query, {
    publishedOnly: false,
  });
  sendData(res, items, { meta: buildPageMeta({ page, limit, total }) });
}

export async function getAdminTour(req, res) {
  sendData(res, await tourService.getTourById(req.params.id));
}

export async function createTour(req, res) {
  const tour = await tourService.createTour(req.body);
  await revalidate(['tours', 'home']);
  sendData(res, tour, { status: 201 });
}

export async function updateTour(req, res) {
  const tour = await tourService.updateTour(req.params.id, req.body);
  await revalidate(['tours', `tour:${tour.slug}`, 'home']);
  sendData(res, tour);
}

export async function updateTourStatus(req, res) {
  const tour = await tourService.setTourStatus(req.params.id, req.body.status);
  await revalidate(['tours', `tour:${tour.slug}`, 'home']);
  sendData(res, tour);
}

export async function deleteTour(req, res) {
  const result = await tourService.deleteTour(req.params.id);
  await revalidate(['tours', 'home']);
  sendData(res, result);
}
